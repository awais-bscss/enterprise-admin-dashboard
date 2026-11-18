import bcrypt from "bcryptjs";
import type { Request, Response } from "express";
import mongoose from "mongoose";
import type { Role } from "../config/rbac.js";
import { Department } from "../models/Department.js";
import { Project } from "../models/Project.js";
import { RefreshToken } from "../models/RefreshToken.js";
import { User } from "../models/User.js";
import { recordAuditEvent } from "../utils/audit.js";
import { sendApiError } from "../utils/httpErrors.js";
import { parsePaginationParams, resolvePaginatedItems } from "../utils/pagination.js";
import {
  getWorkspaceSecurityDefaults,
  validateWorkspacePassword,
} from "../utils/passwordPolicy.js";
import {
  buildUserFilter,
  buildUserListPipeline,
  createUserSchema,
  serializeDirectoryUser,
  summarizeUserDirectoryStats,
  updateUserSchema,
  type PopulatedUserDepartment,
} from "../utils/userHelpers.js";

export async function listUsers(req: Request, res: Response): Promise<void> {
  const query = typeof req.query.q === "string" ? req.query.q.trim() : "";
  const role = typeof req.query.role === "string" ? req.query.role.trim() : "";
  const status = typeof req.query.status === "string" ? req.query.status.trim() : "";
  const departmentId =
    typeof req.query.departmentId === "string" ? req.query.departmentId.trim() : "";
  const { page, limit } = parsePaginationParams(req.query as Record<string, unknown>, {
    limit: 10,
    maxLimit: 100,
  });

  const filter = buildUserFilter({ q: query, role, status, departmentId });

  const [userSummaryAgg, projectAgg, { items: users, pagination }] = await Promise.all([
    User.aggregate<{ _id: { role: Role; status: string }; count: number }>([
      { $group: { _id: { role: "$role", status: "$status" }, count: { $sum: 1 } } },
    ]),
    Project.aggregate<{ _id: mongoose.Types.ObjectId; count: number }>([
      { $project: { teamIds: { $setUnion: [["$ownerId"], { $ifNull: ["$memberIds", []] }] } } },
      { $unwind: "$teamIds" },
      { $group: { _id: "$teamIds", count: { $sum: 1 } } },
    ]),
    resolvePaginatedItems(page, limit, User.countDocuments(filter), (skip) =>
      User.aggregate<{
        _id: unknown;
        name: string;
        email: string;
        role: string;
        status: string;
        departmentId?: PopulatedUserDepartment | null;
        createdAt?: Date;
      }>(buildUserListPipeline(filter, skip, limit)),
    ),
  ]);

  const projectCountMap = new Map<string, number>(
    projectAgg.map((entry) => [String(entry._id), entry.count]),
  );

  res.status(200).json({
    ok: true,
    data: {
      users: users.map((u) => serializeDirectoryUser(u, projectCountMap.get(String(u._id)) ?? 0)),
      stats: summarizeUserDirectoryStats(userSummaryAgg),
      pagination,
    },
  });
}

export async function createUser(req: Request, res: Response): Promise<void> {
  const parsed = createUserSchema.safeParse(req.body);
  if (!parsed.success) {
    sendApiError(
      res,
      400,
      "VALIDATION_ERROR",
      parsed.error.issues[0]?.message ?? "Invalid user payload",
    );
    return;
  }

  const { name, email, password, status, departmentId } = parsed.data;
  if (departmentId && !mongoose.isValidObjectId(departmentId)) {
    sendApiError(res, 400, "VALIDATION_ERROR", "Invalid department id");
    return;
  }

  const [policy, duplicate, departmentDoc] = await Promise.all([
    getWorkspaceSecurityDefaults(),
    User.exists({ email }),
    departmentId
      ? Department.findById(departmentId).select("_id name code").lean()
      : Promise.resolve(null),
  ]);

  const passwordError = await validateWorkspacePassword(password, policy.enforceStrongPasswords);
  if (passwordError) {
    sendApiError(res, 400, "VALIDATION_ERROR", passwordError);
    return;
  }

  const assignedRole = parsed.data.role ?? policy.defaultNewUserRole;

  if (duplicate) {
    sendApiError(res, 409, "EMAIL_EXISTS", "A user with this email already exists");
    return;
  }
  if (departmentId && !departmentDoc) {
    sendApiError(res, 400, "VALIDATION_ERROR", "Selected department is unavailable");
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const userId = new mongoose.Types.ObjectId();
  const [created] = await Promise.all([
    User.create({
      _id: userId,
      name,
      email,
      passwordHash,
      role: assignedRole,
      status,
      departmentId: departmentDoc ? departmentDoc._id : null,
    }),
    recordAuditEvent({
      actor: req.auth!,
      action: "user.created",
      resourceType: "user",
      resourceId: String(userId),
      summary: `Added user ${email} as ${assignedRole}`,
    }),
  ]);

  res.status(201).json({
    ok: true,
    data: {
      user: serializeDirectoryUser({ ...created.toObject(), departmentId: departmentDoc }, 0),
    },
  });
}

export async function updateUser(req: Request, res: Response): Promise<void> {
  const id = String(req.params.id ?? "");
  if (!mongoose.isValidObjectId(id)) {
    sendApiError(res, 400, "VALIDATION_ERROR", "Invalid user id");
    return;
  }

  const parsed = updateUserSchema.safeParse(req.body);
  if (!parsed.success) {
    sendApiError(
      res,
      400,
      "VALIDATION_ERROR",
      parsed.error.issues[0]?.message ?? "Invalid update payload",
    );
    return;
  }

  const isSelf = id === req.auth!.userId;
  if (isSelf && (parsed.data.role !== undefined || parsed.data.status === "suspended")) {
    sendApiError(res, 400, "SELF_LOCKOUT_GUARD", "You cannot demote or suspend your own account");
    return;
  }

  if (parsed.data.departmentId && !mongoose.isValidObjectId(parsed.data.departmentId)) {
    sendApiError(res, 400, "VALIDATION_ERROR", "Invalid department id");
    return;
  }

  const [user, departmentDoc] = await Promise.all([
    User.findById(id).select("name email role status departmentId createdAt"),
    parsed.data.departmentId
      ? Department.findById(parsed.data.departmentId).select("_id name code").lean()
      : Promise.resolve(null),
  ]);

  if (!user) {
    sendApiError(res, 404, "NOT_FOUND", "User not found");
    return;
  }
  if (parsed.data.departmentId && !departmentDoc) {
    sendApiError(res, 400, "VALIDATION_ERROR", "Selected department is unavailable");
    return;
  }

  if (parsed.data.email && parsed.data.email !== user.email) {
    const emailTaken = await User.exists({ email: parsed.data.email, _id: { $ne: user._id } });
    if (emailTaken) {
      sendApiError(res, 409, "EMAIL_EXISTS", "Another user already uses this email");
      return;
    }
    user.email = parsed.data.email;
  }

  let revokeTokens = false;
  if (parsed.data.password) {
    const passwordError = await validateWorkspacePassword(parsed.data.password);
    if (passwordError) {
      sendApiError(res, 400, "VALIDATION_ERROR", passwordError);
      return;
    }
    user.passwordHash = await bcrypt.hash(parsed.data.password, 10);
    revokeTokens = true;
  }

  if (parsed.data.name !== undefined) user.name = parsed.data.name;
  if (parsed.data.role !== undefined) user.role = parsed.data.role;
  if (parsed.data.status !== undefined) {
    user.status = parsed.data.status;
    if (parsed.data.status === "suspended") revokeTokens = true;
  }
  if (parsed.data.departmentId !== undefined) {
    user.departmentId = parsed.data.departmentId
      ? new mongoose.Types.ObjectId(parsed.data.departmentId)
      : null;
  }

  const [saved, , projectCount] = await Promise.all([
    user.save(),
    revokeTokens
      ? RefreshToken.updateMany({ userId: user._id, revokedAt: null }, { revokedAt: new Date() })
      : Promise.resolve(),
    Project.countDocuments({ $or: [{ ownerId: user._id }, { memberIds: user._id }] }),
    recordAuditEvent({
      actor: req.auth!,
      action: "user.updated",
      resourceType: "user",
      resourceId: String(user._id),
      summary: `Updated ${user.email} (${user.role}, ${user.status})`,
    }),
  ]);

  await saved.populate("departmentId", "name code");

  res.status(200).json({
    ok: true,
    data: {
      user: serializeDirectoryUser(
        saved.toObject() as unknown as Parameters<typeof serializeDirectoryUser>[0],
        projectCount,
      ),
    },
  });
}

export async function deleteUser(req: Request, res: Response): Promise<void> {
  const id = String(req.params.id ?? "");
  if (!mongoose.isValidObjectId(id)) {
    sendApiError(res, 400, "VALIDATION_ERROR", "Invalid user id");
    return;
  }

  if (id === req.auth!.userId) {
    sendApiError(res, 400, "SELF_LOCKOUT_GUARD", "You cannot delete your own active account");
    return;
  }

  const existing = await User.findById(id).select("name email role").lean();
  if (!existing) {
    sendApiError(res, 404, "NOT_FOUND", "User not found");
    return;
  }

  await Promise.all([
    Project.updateMany({ ownerId: existing._id }, { ownerId: req.auth!.userId }),
    Project.updateMany({ memberIds: existing._id }, { $pull: { memberIds: existing._id } }),
    RefreshToken.deleteMany({ userId: existing._id }),
    User.deleteOne({ _id: existing._id }),
    recordAuditEvent({
      actor: req.auth!,
      action: "user.deleted",
      resourceType: "user",
      resourceId: String(existing._id),
      summary: `Deleted user ${existing.email} (${existing.role})`,
    }),
  ]);

  res.status(200).json({ ok: true, data: { deletedId: String(existing._id) } });
}
