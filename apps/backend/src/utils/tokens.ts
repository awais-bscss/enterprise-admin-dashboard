import crypto from "node:crypto";
import type { Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import type { Role } from "../config/rbac.js";

export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
export const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;
export const REFRESH_COOKIE_NAME = "refresh_token";
export const CSRF_COOKIE_NAME = "csrf_token";

export interface AccessTokenPayload {
  sub: string;
  role: Role;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: ACCESS_TOKEN_TTL_SECONDS,
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as jwt.JwtPayload;
  if (typeof decoded.sub !== "string" || typeof decoded.role !== "string") {
    throw new Error("Invalid access token payload");
  }
  return {
    sub: decoded.sub,
    role: decoded.role as Role,
  };
}

export function generateOpaqueToken(): string {
  return crypto.randomBytes(48).toString("hex");
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function signCsrfNonce(nonce: string): string {
  const secret = env.CSRF_SECRET ?? env.JWT_REFRESH_SECRET;
  return crypto.createHmac("sha256", secret).update(nonce).digest("hex");
}

export function createCsrfToken(): string {
  const nonce = crypto.randomBytes(24).toString("hex");
  return `${nonce}.${signCsrfNonce(nonce)}`;
}

export function verifyCsrfToken(token: string): boolean {
  const [nonce, signature] = token.split(".");
  if (!nonce || !signature) return false;

  const expected = signCsrfNonce(nonce);
  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length) return false;

  return crypto.timingSafeEqual(sigBuf, expBuf);
}

export function setAuthCookies(res: Response, refreshToken: string, csrfToken: string): void {
  const isProd = env.NODE_ENV === "production";

  res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    path: "/api",
    maxAge: REFRESH_TOKEN_TTL_MS,
  });

  // Readable by same-origin client code for double-submit CSRF verification.
  res.cookie(CSRF_COOKIE_NAME, csrfToken, {
    httpOnly: false,
    sameSite: "lax",
    secure: isProd,
    path: "/",
    maxAge: REFRESH_TOKEN_TTL_MS,
  });
}

export function clearAuthCookies(res: Response): void {
  const isProd = env.NODE_ENV === "production";

  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd,
    path: "/api",
  });

  res.clearCookie(CSRF_COOKIE_NAME, {
    httpOnly: false,
    sameSite: "lax",
    secure: isProd,
    path: "/",
  });
}
