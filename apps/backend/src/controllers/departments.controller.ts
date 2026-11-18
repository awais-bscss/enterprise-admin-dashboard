import type { Request, Response } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { Department, ENTITY_STATUSES } from "../models/Department.js";
import { Project } from "../models/Project.js";
import { User } from "../models/User.js";
import { recordAuditEvent } from "../utils/audit.js";
import { sendApiError } from "../utils/httpErrors.js";
import { parsePaginationParams, resolvePaginatedItems } from "../utils/pagination.js";
import { escapeRegex, summarizeActiveStatus } from "../utils/query.js";

const createDepartmentSchema = z.object({
  name: z.string().trim().min(2, "Department name must be at least 2 characters").max(80),
  code: z
    .string()
    .trim()
    .min(2, "Code must be 2 to 16 characters")
    .max(16)
    .transform((val) => val.toUpperCase()),
  headName: z.string().trim().min(2, "Department head must be at least 2 characters").max(80),
  description: z.string().trim().max(300).optional().default(""),
  status: z.enum(ENTITY_STATUSES).optional().default("active"),
});

const updateDepartmentSchema = createDepartmentSchema.partial();

function serializeDepartment(
  doc: {
    _id: unknown;
    name: string;
    code: string;
    headName: string;
    description: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  },
  counts = { employeeCount: 0, projectCount: 0 },
) {
  return {
    id: String(doc._id),
    name: doc.name,
    code: doc.code,
    headName: doc.headName,
    description: doc.description,
    status: doc.status as "active" | "inactive",
    employeeCount: counts.employeeCount,
    projectCount: counts.projectCount,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export async function listDepartments(req: Request, res: Response): Promise<void> {
  const query = typeof req.query.q === "string" ? req.query.q.trim() : "";
  const status = typeof req.query.status === "string" ? req.query.status.trim() : "";
  const { page, limit } = parsePaginationParams(req.query as Record<string, unknown>, {
    limit: 10,
    maxLimit: 100,
  });

  const filter: Record<string, unknown> = {};
  if (query) {
    const regex = new RegExp(escapeRegex(query), "i");
    filter.$or = [{ name: regex }, { code: regex }, { headName: regex }];
  }
  if (ENTITY_STATUSES.includes(status as (typeof ENTITY_STATUSES)[number])) {
    filter.status = status;
  }

  const [stats, employeeCountsAgg, projectCountsAgg, { items: departments, pagination }] =
    await Promise.all([
      summarizeActiveStatus(Department),
      User.aggregate<{ _id: mongoose.Types.ObjectId; count: number }>([
        { $match: { departmentId: { $ne: null } } },
        { $group: { _id: "$departmentId", count: { $sum: 1 } } },
      ]),
      Project.aggregate<{ _id: mongoose.Types.ObjectId; count: number }>([
        { $match: { departmentId: { $ne: null } } },
        { $group: { _id: "$departmentId", count: { $sum: 1 } } },
      ]),
      resolvePaginatedItems(page, limit, Department.countDocuments(filter), (skip) =>
        Department.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      ),
    ]);

  const employeeMap = new Map(employeeCountsAgg.map((row) => [String(row._id), row.count]));
  const projectMap = new Map(projectCountsAgg.map((row) => [String(row._id), row.count]));

  res.status(200).json({
    ok: true,
    data: {
      departments: departments.map((dept) =>
        serializeDepartment(dept, {
          employeeCount: employeeMap.get(String(dept._id)) ?? 0,
          projectCount: projectMap.get(String(dept._id)) ?? 0,
        }),
      ),
      stats,
      pagination,
    },
  });
}

export async function createDepartment(req: Request, res: Response): Promise<void> {
  const parsed = createDepartmentSchema.safeParse(req.body);
  if (!parsed.success) {
    sendApiError(
      res,
      400,
      "VALIDATION_ERROR",
      parsed.error.issues[0]?.message ?? "Invalid department payload",
    );
    return;
  }

  const data = parsed.data;
  const duplicate = await Department.exists({ code: data.code });
  if (duplicate) {
    sendApiError(res, 409, "CODE_EXISTS", "A department with this code already exists");
    return;
  }

  const deptId = new mongoose.Types.ObjectId();
  const [created] = await Promise.all([
    Department.create({
      _id: deptId,
      ...data,
    }),
    recordAuditEvent({
      actor: req.auth!,
      action: "department.created",
      resourceType: "department",
      resourceId: String(deptId),
      summary: `Created department "${data.name}" (${data.code})`,
    }),
  ]);

  res.status(201).json({
    ok: true,
    data: { department: serializeDepartment(created) },
  });
}

export async function updateDepartment(req: Request, res: Response): Promise<void> {
  const id = String(req.params.id ?? "");
  if (!mongoose.isValidObjectId(id)) {
    sendApiError(res, 400, "VALIDATION_ERROR", "Invalid department id");
    return;
  }

  const parsed = updateDepartmentSchema.safeParse(req.body);
  if (!parsed.success) {
    sendApiError(
      res,
      400,
      "VALIDATION_ERROR",
      parsed.error.issues[0]?.message ?? "Invalid department update",
    );
    return;
  }

  const existing = await Department.findById(id);
  if (!existing) {
    sendApiError(res, 404, "NOT_FOUND", "Department not found");
    return;
  }

  const patch = parsed.data;
  if (patch.code && patch.code !== existing.code) {
    const duplicate = await Department.exists({ code: patch.code, _id: { $ne: existing._id } });
    if (duplicate) {
      sendApiError(res, 409, "CODE_EXISTS", "A department with this code already exists");
      return;
    }
    existing.code = patch.code;
  }

  if (patch.name !== undefined) existing.name = patch.name;
  if (patch.headName !== undefined) existing.headName = patch.headName;
  if (patch.description !== undefined) existing.description = patch.description;
  if (patch.status !== undefined) existing.status = patch.status;

  const [, employeeCount, projectCount] = await Promise.all([
    existing.save(),
    User.countDocuments({ departmentId: existing._id }),
    Project.countDocuments({ departmentId: existing._id }),
    recordAuditEvent({
      actor: req.auth!,
      action: "department.updated",
      resourceType: "department",
      resourceId: String(existing._id),
      summary: `Updated department "${existing.name}" (${existing.code})`,
    }),
  ]);

  res.status(200).json({
    ok: true,
    data: { department: serializeDepartment(existing, { employeeCount, projectCount }) },
  });
}

export async function deleteDepartment(req: Request, res: Response): Promise<void> {
  const id = String(req.params.id ?? "");
  if (!mongoose.isValidObjectId(id)) {
    sendApiError(res, 400, "VALIDATION_ERROR", "Invalid department id");
    return;
  }

  const deleted = await Department.findByIdAndDelete(id).select("name code").lean();
  if (!deleted) {
    sendApiError(res, 404, "NOT_FOUND", "Department not found");
    return;
  }

  await Promise.all([
    Project.updateMany({ departmentId: deleted._id }, { $set: { departmentId: null } }),
    User.updateMany({ departmentId: deleted._id }, { $set: { departmentId: null } }),
    recordAuditEvent({
      actor: req.auth!,
      action: "department.deleted",
      resourceType: "department",
      resourceId: String(deleted._id),
      summary: `Deleted department "${deleted.name}" (${deleted.code})`,
    }),
  ]);

  res.status(200).json({ ok: true, data: { deletedId: String(deleted._id) } });
}
