import bcrypt from "bcryptjs";
import type { Request, Response } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { ROLES, type Role } from "../config/rbac.js";
import { Project } from "../models/Project.js";
import { RefreshToken } from "../models/RefreshToken.js";
import { User } from "../models/User.js";
import { recordAuditEvent } from "../utils/audit.js";
import { sendApiError } from "../utils/httpErrors.js";
import {
  getWorkspaceSecurityDefaults,
  validateWorkspacePassword,
} from "../utils/passwordPolicy.js";

const createUserSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80),
  email: z.string().trim().email("Please enter a valid email address").toLowerCase(),
  password: z.string().min(6, "Password must be at least 6 characters").max(128),
  role: z.enum(ROLES).optional(),
  status: z.enum(["active", "suspended"]).optional().default("active"),
});

const updateUserSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80).optional(),
  email: z.string().trim().email("Please enter a valid email address").toLowerCase().optional(),
  role: z.enum(ROLES).optional(),
  status: z.enum(["active", "suspended"]).optional(),
  password: z.string().min(6, "Password must be at least 6 characters").max(128).optional(),
});

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function serializeDirectoryUser(
  user: {
    _id: unknown;
    name: string;
    email: string;
    role: string;
    status: string;
    createdAt?: Date;
  },
  projectCount = 0,
) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role as Role,
    status: user.status as "active" | "suspended",
    projectCount,
    createdAt: user.createdAt ? user.createdAt.toISOString() : undefined,
  };
}

export async function listUsers(req: Request, res: Response): Promise<void> {
  const query = typeof req.query.q === "string" ? req.query.q.trim() : "";
  const role = typeof req.query.role === "string" ? req.query.role.trim() : "";
  const status = typeof req.query.status === "string" ? req.query.status.trim() : "";

  const filter: Record<string, unknown> = {};
  if (query) {
    const regex = new RegExp(escapeRegex(query), "i");
    filter.$or = [{ name: regex }, { email: regex }];
  }
  if (ROLES.includes(role as Role)) {
    filter.role = role;
  }
  if (status === "active" || status === "suspended") {
    filter.status = status;
  }

  const [users, allUsers, projectAgg] = await Promise.all([
    User.find(filter).select("name email role status createdAt").sort({ createdAt: -1 }).lean(),
    User.find().select("role status").lean(),
    Project.aggregate<{ _id: mongoose.Types.ObjectId; count: number }>([
      { $group: { _id: "$ownerId", count: { $sum: 1 } } },
    ]),
  ]);

  const projectCountMap = new Map<string, number>(
    projectAgg.map((entry) => [String(entry._id), entry.count]),
  );

  const stats = {
    total: allUsers.length,
    active: allUsers.filter((u) => u.status === "active").length,
    suspended: allUsers.filter((u) => u.status === "suspended").length,
    admins: allUsers.filter((u) => u.role === "admin").length,
    managers: allUsers.filter((u) => u.role === "manager").length,
    viewers: allUsers.filter((u) => u.role === "viewer").length,
  };

  res.status(200).json({
    ok: true,
    data: {
      users: users.map((u) => serializeDirectoryUser(u, projectCountMap.get(String(u._id)) ?? 0)),
      stats,
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

  const { name, email, password, status } = parsed.data;
  const policy = await getWorkspaceSecurityDefaults();
  const passwordError = await validateWorkspacePassword(password, policy.enforceStrongPasswords);
  if (passwordError) {
    sendApiError(res, 400, "VALIDATION_ERROR", passwordError);
    return;
  }

  const assignedRole = parsed.data.role ?? policy.defaultNewUserRole;

  const duplicate = await User.exists({ email });
  if (duplicate) {
    sendApiError(res, 409, "EMAIL_EXISTS", "A user with this email already exists");
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const created = await User.create({
    name,
    email,
    passwordHash,
    role: assignedRole,
    status,
  });

  await recordAuditEvent({
    actor: req.auth!,
    action: "user.created",
    resourceType: "user",
    resourceId: String(created._id),
    summary: `Added user ${created.email} as ${created.role}`,
  });

  res.status(201).json({
    ok: true,
    data: { user: serializeDirectoryUser(created, 0) },
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

  const user = await User.findById(id).select("name email role status createdAt");
  if (!user) {
    sendApiError(res, 404, "NOT_FOUND", "User not found");
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

  await user.save();

  if (revokeTokens) {
    await RefreshToken.updateMany({ userId: user._id, revokedAt: null }, { revokedAt: new Date() });
  }

  const projectCount = await Project.countDocuments({ ownerId: user._id });

  await recordAuditEvent({
    actor: req.auth!,
    action: "user.updated",
    resourceType: "user",
    resourceId: String(user._id),
    summary: `Updated ${user.email} (${user.role}, ${user.status})`,
  });

  res.status(200).json({
    ok: true,
    data: { user: serializeDirectoryUser(user, projectCount) },
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

  // Reassign any projects owned by the removed account to the acting admin.
  await Promise.all([
    Project.updateMany({ ownerId: existing._id }, { ownerId: req.auth!.userId }),
    RefreshToken.deleteMany({ userId: existing._id }),
    User.deleteOne({ _id: existing._id }),
  ]);

  await recordAuditEvent({
    actor: req.auth!,
    action: "user.deleted",
    resourceType: "user",
    resourceId: String(existing._id),
    summary: `Deleted user ${existing.email} (${existing.role})`,
  });

  res.status(200).json({ ok: true, data: { deletedId: String(existing._id) } });
}
