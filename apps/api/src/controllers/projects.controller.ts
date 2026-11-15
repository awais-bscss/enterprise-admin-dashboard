import type { Request, Response } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import {
  PROJECT_CATEGORIES,
  PROJECT_PRIORITIES,
  PROJECT_STATUSES,
  Project,
} from "../models/Project.js";
import { User } from "../models/User.js";
import { recordAuditEvent } from "../utils/audit.js";
import { sendApiError } from "../utils/httpErrors.js";

const createProjectSchema = z.object({
  name: z.string().trim().min(2, "Project name must be at least 2 characters").max(100),
  description: z.string().trim().max(500).optional().default(""),
  category: z.enum(PROJECT_CATEGORIES).default("development"),
  status: z.enum(PROJECT_STATUSES).default("in_progress"),
  priority: z.enum(PROJECT_PRIORITIES).default("medium"),
  tasksTotal: z.coerce.number().int().min(1, "Total tasks must be at least 1").max(1000).default(10),
  tasksCompleted: z.coerce.number().int().min(0).max(1000).default(0),
  progress: z.coerce.number().int().min(0).max(100).optional(),
  ownerId: z.string().trim().optional(),
  dueDate: z
    .string()
    .trim()
    .optional()
    .nullable()
    .transform((val) => (val ? new Date(val) : null)),
});

const updateProjectSchema = createProjectSchema.partial();

interface PopulatedOwner {
  _id: unknown;
  name: string;
  email: string;
  role: string;
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function resolveProgress(
  status: (typeof PROJECT_STATUSES)[number],
  tasksTotal: number,
  tasksCompleted: number,
  explicitProgress?: number,
): number {
  if (status === "completed") return 100;
  if (typeof explicitProgress === "number") return Math.max(0, Math.min(100, explicitProgress));
  if (tasksTotal <= 0) return 0;
  return Math.round((Math.min(tasksCompleted, tasksTotal) / tasksTotal) * 100);
}

function serializeProject(doc: {
  _id: unknown;
  name: string;
  description: string;
  category: string;
  status: string;
  progress: number;
  tasksTotal: number;
  tasksCompleted: number;
  priority: string;
  dueDate: Date | null;
  ownerId: PopulatedOwner | mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}) {
  const owner =
    doc.ownerId && typeof doc.ownerId === "object" && "email" in doc.ownerId
      ? {
          id: String(doc.ownerId._id),
          name: doc.ownerId.name,
          email: doc.ownerId.email,
          role: doc.ownerId.role,
        }
      : { id: String(doc.ownerId), name: "Workspace Member", email: "", role: "viewer" };

  return {
    id: String(doc._id),
    name: doc.name,
    description: doc.description,
    category: doc.category,
    status: doc.status,
    progress: doc.progress,
    tasksTotal: doc.tasksTotal,
    tasksCompleted: doc.tasksCompleted,
    priority: doc.priority,
    dueDate: doc.dueDate ? doc.dueDate.toISOString() : null,
    owner,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export async function listProjects(req: Request, res: Response): Promise<void> {
  const query = typeof req.query.q === "string" ? req.query.q.trim() : "";
  const category = typeof req.query.category === "string" ? req.query.category.trim() : "";
  const status = typeof req.query.status === "string" ? req.query.status.trim() : "";

  const filter: Record<string, unknown> = {};
  if (query) {
    const regex = new RegExp(escapeRegex(query), "i");
    filter.$or = [{ name: regex }, { description: regex }];
  }
  if (PROJECT_CATEGORIES.includes(category as (typeof PROJECT_CATEGORIES)[number])) {
    filter.category = category;
  }
  if (PROJECT_STATUSES.includes(status as (typeof PROJECT_STATUSES)[number])) {
    filter.status = status;
  }

  const projects = await Project.find(filter)
    .populate("ownerId", "name email role")
    .sort({ updatedAt: -1 })
    .lean();

  res.status(200).json({
    ok: true,
    data: {
      projects: projects.map((project) => serializeProject(project as Parameters<typeof serializeProject>[0])),
    },
  });
}

export async function createProject(req: Request, res: Response): Promise<void> {
  const parsed = createProjectSchema.safeParse(req.body);
  if (!parsed.success) {
    sendApiError(
      res,
      400,
      "VALIDATION_ERROR",
      parsed.error.issues[0]?.message ?? "Invalid project payload",
    );
    return;
  }

  const data = parsed.data;
  if (data.dueDate && Number.isNaN(data.dueDate.getTime())) {
    sendApiError(res, 400, "VALIDATION_ERROR", "Invalid due date format");
    return;
  }

  let assignedOwnerId = req.auth!.userId;
  if (data.ownerId) {
    if (!mongoose.isValidObjectId(data.ownerId)) {
      sendApiError(res, 400, "VALIDATION_ERROR", "Invalid owner user id");
      return;
    }
    const ownerExists = await User.exists({ _id: data.ownerId, status: "active" });
    if (!ownerExists) {
      sendApiError(res, 400, "VALIDATION_ERROR", "Selected project owner is unavailable");
      return;
    }
    assignedOwnerId = data.ownerId;
  }

  const tasksCompleted =
    data.status === "completed" ? data.tasksTotal : Math.min(data.tasksCompleted, data.tasksTotal);
  const progress = resolveProgress(data.status, data.tasksTotal, tasksCompleted, data.progress);

  const created = await Project.create({
    name: data.name,
    description: data.description,
    category: data.category,
    status: data.status,
    priority: data.priority,
    tasksTotal: data.tasksTotal,
    tasksCompleted,
    progress,
    dueDate: data.dueDate ?? null,
    ownerId: assignedOwnerId,
  });

  await created.populate("ownerId", "name email role");

  await recordAuditEvent({
    actor: req.auth!,
    action: "project.created",
    resourceType: "project",
    resourceId: String(created._id),
    summary: `Created project "${created.name}" (${created.category})`,
  });

  res.status(201).json({
    ok: true,
    data: {
      project: serializeProject(created.toObject() as unknown as Parameters<typeof serializeProject>[0]),
    },
  });
}

export async function updateProject(req: Request, res: Response): Promise<void> {
  const id = String(req.params.id ?? "");
  if (!mongoose.isValidObjectId(id)) {
    sendApiError(res, 400, "VALIDATION_ERROR", "Invalid project id");
    return;
  }

  const parsed = updateProjectSchema.safeParse(req.body);
  if (!parsed.success) {
    sendApiError(
      res,
      400,
      "VALIDATION_ERROR",
      parsed.error.issues[0]?.message ?? "Invalid project update",
    );
    return;
  }

  const existing = await Project.findById(id);
  if (!existing) {
    sendApiError(res, 404, "NOT_FOUND", "Project not found");
    return;
  }

  const patch = parsed.data;
  if (patch.dueDate && Number.isNaN(patch.dueDate.getTime())) {
    sendApiError(res, 400, "VALIDATION_ERROR", "Invalid due date format");
    return;
  }

  if (patch.name !== undefined) existing.name = patch.name;
  if (patch.description !== undefined) existing.description = patch.description;
  if (patch.category !== undefined) existing.category = patch.category;
  if (patch.status !== undefined) existing.status = patch.status;
  if (patch.priority !== undefined) existing.priority = patch.priority;
  if (patch.tasksTotal !== undefined) existing.tasksTotal = patch.tasksTotal;
  if (patch.tasksCompleted !== undefined) existing.tasksCompleted = patch.tasksCompleted;
  if (patch.dueDate !== undefined) existing.dueDate = patch.dueDate;
  if (patch.ownerId) {
    if (!mongoose.isValidObjectId(patch.ownerId)) {
      sendApiError(res, 400, "VALIDATION_ERROR", "Invalid owner user id");
      return;
    }
    const ownerExists = await User.exists({ _id: patch.ownerId, status: "active" });
    if (!ownerExists) {
      sendApiError(res, 400, "VALIDATION_ERROR", "Selected project owner is unavailable");
      return;
    }
    existing.ownerId = new mongoose.Types.ObjectId(patch.ownerId);
  }

  existing.tasksCompleted =
    existing.status === "completed"
      ? existing.tasksTotal
      : Math.min(existing.tasksCompleted, existing.tasksTotal);
  existing.progress = resolveProgress(
    existing.status as (typeof PROJECT_STATUSES)[number],
    existing.tasksTotal,
    existing.tasksCompleted,
    patch.progress,
  );

  await existing.save();
  await existing.populate("ownerId", "name email role");

  await recordAuditEvent({
    actor: req.auth!,
    action: "project.updated",
    resourceType: "project",
    resourceId: String(existing._id),
    summary: `Updated project "${existing.name}" (${existing.status}, ${existing.progress}%)`,
  });

  res.status(200).json({
    ok: true,
    data: {
      project: serializeProject(existing.toObject() as unknown as Parameters<typeof serializeProject>[0]),
    },
  });
}

export async function deleteProject(req: Request, res: Response): Promise<void> {
  const id = String(req.params.id ?? "");
  if (!mongoose.isValidObjectId(id)) {
    sendApiError(res, 400, "VALIDATION_ERROR", "Invalid project id");
    return;
  }

  const deleted = await Project.findByIdAndDelete(id).lean();
  if (!deleted) {
    sendApiError(res, 404, "NOT_FOUND", "Project not found");
    return;
  }

  await recordAuditEvent({
    actor: req.auth!,
    action: "project.deleted",
    resourceType: "project",
    resourceId: String(deleted._id),
    summary: `Deleted project "${deleted.name}"`,
  });

  res.status(200).json({ ok: true, data: { deletedId: String(deleted._id) } });
}
