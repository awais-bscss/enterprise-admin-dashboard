import mongoose from "mongoose";
import { z } from "zod";
import { ROLES, type Role } from "../config/rbac.js";
import { Department } from "../models/Department.js";
import { escapeRegex } from "./query.js";

export const createUserSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  email: z.string().trim().email("Please enter a valid email address").toLowerCase(),
  password: z.string().min(6, "Password must be at least 6 characters").max(128),
  role: z.enum(ROLES).optional(),
  status: z.enum(["active", "suspended"]).optional().default("active"),
  departmentId: z.string().trim().optional().nullable(),
});

export const updateUserSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80).optional(),
  email: z.string().trim().email("Please enter a valid email address").toLowerCase().optional(),
  role: z.enum(ROLES).optional(),
  status: z.enum(["active", "suspended"]).optional(),
  password: z.string().min(6, "Password must be at least 6 characters").max(128).optional(),
  departmentId: z.string().trim().optional().nullable(),
});

export interface PopulatedUserDepartment {
  _id: unknown;
  name: string;
  code: string;
}

export function serializeDirectoryUser(
  user: {
    _id: unknown;
    name: string;
    email: string;
    role: string;
    status: string;
    departmentId?: PopulatedUserDepartment | mongoose.Types.ObjectId | null;
    createdAt?: Date;
  },
  projectCount = 0,
) {
  const department =
    user.departmentId && typeof user.departmentId === "object" && "name" in user.departmentId
      ? {
          id: String(user.departmentId._id),
          name: user.departmentId.name,
          code: user.departmentId.code,
        }
      : null;

  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role as Role,
    status: user.status as "active" | "suspended",
    department,
    projectCount,
    createdAt: user.createdAt ? user.createdAt.toISOString() : undefined,
  };
}

export function buildUserFilter(params: {
  q?: string;
  role?: string;
  status?: string;
  departmentId?: string;
}): Record<string, unknown> {
  const filter: Record<string, unknown> = {};
  if (params.q) {
    const regex = new RegExp(escapeRegex(params.q), "i");
    filter.$or = [{ name: regex }, { email: regex }];
  }
  if (params.role && ROLES.includes(params.role as Role)) {
    filter.role = params.role;
  }
  if (params.status === "active" || params.status === "suspended") {
    filter.status = params.status;
  }
  if (params.departmentId && mongoose.isValidObjectId(params.departmentId)) {
    filter.departmentId = new mongoose.Types.ObjectId(params.departmentId);
  }
  return filter;
}

export function buildUserListPipeline(
  filter: Record<string, unknown>,
  skip: number,
  limit: number,
): mongoose.PipelineStage[] {
  return [
    { $match: filter },
    { $sort: { createdAt: -1 } },
    { $skip: skip },
    { $limit: limit },
    {
      $lookup: {
        from: Department.collection.name,
        localField: "departmentId",
        foreignField: "_id",
        pipeline: [{ $project: { _id: 1, name: 1, code: 1 } }],
        as: "departmentDocs",
      },
    },
    {
      $project: {
        name: 1,
        email: 1,
        role: 1,
        status: 1,
        createdAt: 1,
        departmentId: { $ifNull: [{ $arrayElemAt: ["$departmentDocs", 0] }, null] },
      },
    },
  ];
}

export function summarizeUserDirectoryStats(
  rows: Array<{ _id: { role: Role; status: string }; count: number }>,
) {
  const stats = {
    total: 0,
    active: 0,
    suspended: 0,
    admins: 0,
    managers: 0,
    viewers: 0,
  };
  for (const entry of rows) {
    stats.total += entry.count;
    if (entry._id.status === "active") stats.active += entry.count;
    else if (entry._id.status === "suspended") stats.suspended += entry.count;

    if (entry._id.role === "admin") stats.admins += entry.count;
    else if (entry._id.role === "manager") stats.managers += entry.count;
    else if (entry._id.role === "viewer") stats.viewers += entry.count;
  }
  return stats;
}

