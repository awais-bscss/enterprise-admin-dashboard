import type { Request, Response } from "express";
import mongoose from "mongoose";
import { PROJECT_STATUSES, Project } from "../models/Project.js";
import { recordAuditEvent } from "../utils/audit.js";
import { sendApiError } from "../utils/httpErrors.js";
import { parsePaginationParams, resolvePaginatedItems } from "../utils/pagination.js";
import {
  buildProjectFilter,
  buildProjectListPipeline,
  createProjectSchema,
  resolveActiveMembers,
  resolveProgress,
  resolveProjectReferences,
  serializeProject,
  updateProjectSchema,
  type PopulatedOwner,
  type SerializedProjectInput,
} from "../utils/projectHelpers.js";

export async function listProjects(req: Request, res: Response): Promise<void> {
  const query = typeof req.query.q === "string" ? req.query.q.trim() : "";
  const departmentId =
    typeof req.query.departmentId === "string" ? req.query.departmentId.trim() : "";
  const clientId = typeof req.query.clientId === "string" ? req.query.clientId.trim() : "";
  const ownerId = typeof req.query.ownerId === "string" ? req.query.ownerId.trim() : "";
  const status = typeof req.query.status === "string" ? req.query.status.trim() : "";
  const sort = typeof req.query.sort === "string" ? req.query.sort.trim() : "recent";
  const { page, limit } = parsePaginationParams(req.query as Record<string, unknown>, {
    limit: 8,
    maxLimit: 50,
  });

  const filter = buildProjectFilter({ q: query, departmentId, clientId, ownerId, status });

  const [statusCounts, { items: projects, pagination }] = await Promise.all([
    Project.aggregate<{ _id: string; count: number }>([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]),
    resolvePaginatedItems(page, limit, Project.countDocuments(filter), (skip) =>
      Project.aggregate<SerializedProjectInput>(buildProjectListPipeline(filter, sort, skip, limit)),
    ),
  ]);

  const statusMap = new Map(statusCounts.map((entry) => [entry._id, entry.count]));
  const completed = statusMap.get("completed") ?? 0;
  const inProgress = statusMap.get("in_progress") ?? 0;
  const upcoming = statusMap.get("upcoming") ?? 0;

  res.status(200).json({
    ok: true,
    data: {
      projects: projects.map((project) => serializeProject(project)),
      stats: {
        total: completed + inProgress + upcoming,
        completed,
        inProgress,
        upcoming,
      },
      pagination,
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
  const refs = await resolveProjectReferences({
    dueDate: data.dueDate,
    ownerId: data.ownerId,
    departmentId: data.departmentId,
    clientId: data.clientId,
    lookupOwner: Boolean(data.ownerId && data.ownerId !== req.auth!.userId),
  });
  if (refs.error) {
    sendApiError(res, 400, "VALIDATION_ERROR", refs.error);
    return;
  }

  const assignedOwnerId = refs.ownerDoc ? String(refs.ownerDoc._id) : req.auth!.userId;
  const ownerSummary: PopulatedOwner = refs.ownerDoc
    ? refs.ownerDoc
    : { _id: req.auth!.userId, name: req.auth!.name, email: req.auth!.email, role: req.auth!.role };

  const teamCheck = await resolveActiveMembers(data.memberIds ?? [], assignedOwnerId);
  if (teamCheck.error) {
    sendApiError(res, 400, "VALIDATION_ERROR", teamCheck.error);
    return;
  }

  const progress = resolveProgress(data.status, data.progress);
  const projectId = new mongoose.Types.ObjectId();

  const [created] = await Promise.all([
    Project.create({
      _id: projectId,
      name: data.name,
      description: data.description,
      departmentId: refs.departmentDoc
        ? new mongoose.Types.ObjectId(String(refs.departmentDoc._id))
        : null,
      clientId: refs.clientDoc ? new mongoose.Types.ObjectId(String(refs.clientDoc._id)) : null,
      status: data.status,
      priority: data.priority,
      progress,
      dueDate: data.dueDate ?? null,
      ownerId: assignedOwnerId,
      memberIds: teamCheck.docs.map((m) => new mongoose.Types.ObjectId(String(m._id))),
    }),
    recordAuditEvent({
      actor: req.auth!,
      action: "project.created",
      resourceType: "project",
      resourceId: String(projectId),
      summary: refs.departmentDoc
        ? `Created project "${data.name}" (${refs.departmentDoc.name})`
        : `Created project "${data.name}"`,
    }),
  ]);

  res.status(201).json({
    ok: true,
    data: {
      project: serializeProject({
        ...(created.toObject() as unknown as SerializedProjectInput),
        ownerId: ownerSummary,
        memberIds: teamCheck.docs,
        departmentId: refs.departmentDoc,
        clientId: refs.clientDoc,
      }),
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

  const patch = parsed.data;
  const [existing, refs] = await Promise.all([
    Project.findById(id),
    resolveProjectReferences({
      dueDate: patch.dueDate,
      ownerId: patch.ownerId,
      departmentId: patch.departmentId,
      clientId: patch.clientId,
      lookupOwner: Boolean(patch.ownerId),
    }),
  ]);

  if (refs.error) {
    sendApiError(res, 400, "VALIDATION_ERROR", refs.error);
    return;
  }
  if (!existing) {
    sendApiError(res, 404, "NOT_FOUND", "Project not found");
    return;
  }

  const nextOwnerId =
    patch.ownerId && refs.ownerDoc ? String(refs.ownerDoc._id) : String(existing.ownerId);

  if (patch.memberIds !== undefined || (patch.ownerId && refs.ownerDoc)) {
    const candidateMemberIds =
      patch.memberIds !== undefined
        ? patch.memberIds
        : existing.memberIds.map((memberId) => String(memberId));
    const teamCheck = await resolveActiveMembers(candidateMemberIds, nextOwnerId);
    if (teamCheck.error) {
      sendApiError(res, 400, "VALIDATION_ERROR", teamCheck.error);
      return;
    }
    existing.memberIds = teamCheck.docs.map((m) => new mongoose.Types.ObjectId(String(m._id)));
  }

  if (patch.name !== undefined) existing.name = patch.name;
  if (patch.description !== undefined) existing.description = patch.description;
  if (patch.departmentId !== undefined) {
    existing.departmentId = patch.departmentId ? new mongoose.Types.ObjectId(patch.departmentId) : null;
  }
  if (patch.clientId !== undefined) {
    existing.clientId = patch.clientId ? new mongoose.Types.ObjectId(patch.clientId) : null;
  }
  if (patch.status !== undefined) existing.status = patch.status;
  if (patch.priority !== undefined) existing.priority = patch.priority;
  if (patch.dueDate !== undefined) existing.dueDate = patch.dueDate;
  if (patch.ownerId && refs.ownerDoc) {
    existing.ownerId = new mongoose.Types.ObjectId(String(refs.ownerDoc._id));
  }

  existing.progress = resolveProgress(
    existing.status as (typeof PROJECT_STATUSES)[number],
    patch.progress ?? existing.progress,
  );

  const [saved] = await Promise.all([
    existing.save(),
    recordAuditEvent({
      actor: req.auth!,
      action: "project.updated",
      resourceType: "project",
      resourceId: String(existing._id),
      summary: `Updated project "${existing.name}" (${existing.progress}% complete)`,
    }),
  ]);

  await saved.populate([
    { path: "ownerId", select: "name email role" },
    { path: "memberIds", select: "name email role" },
    { path: "departmentId", select: "name code" },
    { path: "clientId", select: "name company" },
  ]);

  res.status(200).json({
    ok: true,
    data: {
      project: serializeProject(saved.toObject() as unknown as SerializedProjectInput),
    },
  });
}

export async function deleteProject(req: Request, res: Response): Promise<void> {
  const id = String(req.params.id ?? "");
  if (!mongoose.isValidObjectId(id)) {
    sendApiError(res, 400, "VALIDATION_ERROR", "Invalid project id");
    return;
  }

  const deleted = await Project.findByIdAndDelete(id).select("name").lean();
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
