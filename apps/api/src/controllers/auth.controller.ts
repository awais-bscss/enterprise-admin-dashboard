import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import type { Request, Response } from "express";
import { z } from "zod";
import { getPermissionsForRole, type Role } from "../config/rbac.js";
import { RefreshToken } from "../models/RefreshToken.js";
import { User } from "../models/User.js";
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
  const user = await User.findOne({ email: email.toLowerCase() }).select("+passwordHash");

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

  await RefreshToken.create({
    userId: user._id,
    tokenHash: hashToken(rawRefresh),
    familyId: crypto.randomUUID(),
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
  });

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

  const existing = await RefreshToken.findOne({ tokenHash: hashToken(rawRefresh) });
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

  if (existing.expiresAt.getTime() <= Date.now()) {
    existing.revokedAt = new Date();
    await existing.save();
    clearAuthCookies(res);
    res.status(401).json({
      ok: false,
      error: { code: "SESSION_EXPIRED", message: "Session has expired" },
    });
    return;
  }

  const user = await User.findById(existing.userId);
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

  existing.revokedAt = new Date();
  existing.replacedByHash = nextHash;
  await existing.save();

  await RefreshToken.create({
    userId: user._id,
    tokenHash: nextHash,
    familyId: existing.familyId,
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
  });

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
    const tokenDoc = await RefreshToken.findOne({ tokenHash: hashToken(rawRefresh) });
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
