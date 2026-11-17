import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import type { Request, Response } from "express";
import { z } from "zod";
import { getPermissionsForRole, type Role } from "../config/rbac.js";
import { RefreshToken } from "../models/RefreshToken.js";
import { User } from "../models/User.js";
import { recordAuditEvent } from "../utils/audit.js";
import { sendApiError } from "../utils/httpErrors.js";
import { validateWorkspacePassword } from "../utils/passwordPolicy.js";
import {
  ACCESS_TOKEN_TTL_SECONDS,
  REFRESH_COOKIE_NAME,
  REFRESH_TOKEN_TTL_MS,
  clearAuthCookies,
  createCsrfToken,
  generateOpaqueToken,
  hashToken,
  setAuthCookies,
  signAccessToken,
} from "../utils/tokens.js";

const loginSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

function serializeUser(user: {
  _id: unknown;
  name: string;
  email: string;
  role: string;
}) {
  const role = user.role as Role;
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role,
    permissions: getPermissionsForRole(role),
  };
}

export async function login(req: Request, res: Response): Promise<void> {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      ok: false,
      error: {
        code: "VALIDATION_ERROR",
        message: parsed.error.issues[0]?.message ?? "Invalid login credentials",
      },
    });
    return;
  }

  const { email, password } = parsed.data;
  const user = await User.findOne({ email: email.toLowerCase() }).select("+passwordHash").lean();

  if (!user) {
    res.status(401).json({
      ok: false,
      error: { code: "INVALID_CREDENTIALS", message: "Invalid email or password" },
    });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({
      ok: false,
      error: { code: "INVALID_CREDENTIALS", message: "Invalid email or password" },
    });
    return;
  }

  if (user.status !== "active") {
    res.status(403).json({
      ok: false,
      error: { code: "ACCOUNT_SUSPENDED", message: "This account has been suspended" },
    });
    return;
  }

  const rawRefresh = generateOpaqueToken();
  const csrfToken = createCsrfToken();

  await Promise.all([
    RefreshToken.create({
      userId: user._id,
      tokenHash: hashToken(rawRefresh),
      familyId: crypto.randomUUID(),
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    }),
    recordAuditEvent({
      actor: {
        userId: String(user._id),
        name: user.name,
        email: user.email,
        role: user.role as Role,
      },
      action: "auth.login",
      resourceType: "auth",
      resourceId: String(user._id),
      summary: `Signed in as ${user.role}`,
    }),
  ]);

  setAuthCookies(res, rawRefresh, csrfToken);

  const accessToken = signAccessToken({
    sub: String(user._id),
    role: user.role as Role,
  });

  res.status(200).json({
    ok: true,
    data: {
      accessToken,
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
      user: serializeUser(user),
    },
  });
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const rawRefresh = req.cookies?.[REFRESH_COOKIE_NAME];
  if (typeof rawRefresh !== "string" || !rawRefresh) {
    clearAuthCookies(res);
    res.status(401).json({
      ok: false,
      error: { code: "NO_SESSION", message: "No active session found" },
    });
    return;
  }

  const existing = await RefreshToken.findOne({ tokenHash: hashToken(rawRefresh) })
    .select("_id userId familyId revokedAt expiresAt")
    .lean();
  if (!existing) {
    clearAuthCookies(res);
    res.status(401).json({
      ok: false,
      error: { code: "INVALID_SESSION", message: "Session is invalid" },
    });
    return;
  }

  // Revoke entire token family if a rotated token is replayed.
  if (existing.revokedAt) {
    await RefreshToken.updateMany(
      { familyId: existing.familyId, revokedAt: null },
      { revokedAt: new Date() },
    );
    clearAuthCookies(res);
    res.status(401).json({
      ok: false,
      error: { code: "TOKEN_REUSE_DETECTED", message: "Session revoked for security" },
    });
    return;
  }

  if (new Date(existing.expiresAt).getTime() <= Date.now()) {
    await RefreshToken.updateOne({ _id: existing._id }, { $set: { revokedAt: new Date() } });
    clearAuthCookies(res);
    res.status(401).json({
      ok: false,
      error: { code: "SESSION_EXPIRED", message: "Session has expired" },
    });
    return;
  }

  const user = await User.findById(existing.userId).select("_id name email role status").lean();
  if (!user || user.status !== "active") {
    await RefreshToken.updateMany(
      { familyId: existing.familyId, revokedAt: null },
      { revokedAt: new Date() },
    );
    clearAuthCookies(res);
    res.status(401).json({
      ok: false,
      error: { code: "UNAUTHORIZED", message: "Account is inactive or missing" },
    });
    return;
  }

  const nextRefresh = generateOpaqueToken();
  const nextHash = hashToken(nextRefresh);
  const nextCsrf = createCsrfToken();

  await Promise.all([
    RefreshToken.updateOne(
      { _id: existing._id },
      { $set: { revokedAt: new Date(), replacedByHash: nextHash } },
    ),
    RefreshToken.create({
      userId: user._id,
      tokenHash: nextHash,
      familyId: existing.familyId,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    }),
    recordAuditEvent({
      actor: {
        userId: String(user._id),
        name: user.name,
        email: user.email,
        role: user.role as Role,
      },
      action: "auth.login",
      resourceType: "auth",
      resourceId: String(user._id),
      summary: `Signed in as ${user.role}`,
    }),
  ]);

  setAuthCookies(res, nextRefresh, nextCsrf);

  const accessToken = signAccessToken({
    sub: String(user._id),
    role: user.role as Role,
  });

  res.status(200).json({
    ok: true,
    data: {
      accessToken,
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
      user: serializeUser(user),
    },
  });
}

export async function logout(req: Request, res: Response): Promise<void> {
  const rawRefresh = req.cookies?.[REFRESH_COOKIE_NAME];

  if (typeof rawRefresh === "string" && rawRefresh) {
    const tokenDoc = await RefreshToken.findOne({ tokenHash: hashToken(rawRefresh) })
      .select("familyId")
      .lean();
    if (tokenDoc) {
      await RefreshToken.updateMany(
        { familyId: tokenDoc.familyId, revokedAt: null },
        { revokedAt: new Date() },
      );
    }
  }

  clearAuthCookies(res);
  res.status(200).json({ ok: true });
}

export function me(req: Request, res: Response): void {
  const auth = req.auth!;
  res.status(200).json({
    ok: true,
    data: {
      user: {
        id: auth.userId,
        name: auth.name,
        email: auth.email,
        role: auth.role,
        permissions: auth.permissions,
      },
    },
  });
}

const updateProfileSchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(80).optional(),
    currentPassword: z.string().min(6).optional(),
    newPassword: z.string().min(6, "New password must be at least 6 characters").max(128).optional(),
  })
  .refine((data) => !(data.newPassword && !data.currentPassword), {
    message: "Current password is required to set a new password",
  });

export async function updateProfile(req: Request, res: Response): Promise<void> {
  const parsed = updateProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    sendApiError(
      res,
      400,
      "VALIDATION_ERROR",
      parsed.error.issues[0]?.message ?? "Invalid profile update",
    );
    return;
  }

  const user = await User.findById(req.auth!.userId).select("+passwordHash");
  if (!user || user.status !== "active") {
    sendApiError(res, 401, "UNAUTHORIZED", "Account is inactive or missing");
    return;
  }

  if (parsed.data.newPassword) {
    const matches = await bcrypt.compare(parsed.data.currentPassword ?? "", user.passwordHash);
    if (!matches) {
      sendApiError(res, 400, "INVALID_PASSWORD", "Current password is incorrect");
      return;
    }
    const passwordError = await validateWorkspacePassword(parsed.data.newPassword);
    if (passwordError) {
      sendApiError(res, 400, "VALIDATION_ERROR", passwordError);
      return;
    }
    user.passwordHash = await bcrypt.hash(parsed.data.newPassword, 10);
  }

  if (parsed.data.name) {
    user.name = parsed.data.name;
  }

  await Promise.all([
    user.save(),
    recordAuditEvent({
      actor: {
        userId: String(user._id),
        name: user.name,
        email: user.email,
        role: user.role as Role,
      },
      action: "auth.profile_updated",
      resourceType: "auth",
      resourceId: String(user._id),
      summary: parsed.data.newPassword ? "Updated profile and password" : "Updated display name",
    }),
  ]);

  res.status(200).json({
    ok: true,
    data: {
      user: serializeUser(user),
    },
  });
}
