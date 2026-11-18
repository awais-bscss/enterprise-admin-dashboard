import crypto from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { isAllowedOrigin } from "../config/cors.js";
import { CSRF_COOKIE_NAME, REFRESH_COOKIE_NAME, verifyCsrfToken } from "../utils/tokens.js";

function timingSafeMatch(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export function requireCsrf(req: Request, res: Response, next: NextFunction): void {
  const origin = req.get("origin");
  if (origin && !isAllowedOrigin(origin)) {
    res.status(403).json({
      ok: false,
      error: { code: "CSRF_FORBIDDEN", message: "Invalid request origin" },
    });
    return;
  }

  // Logout with no active session cookies can proceed to clear client state cleanly.
  const hasRefreshCookie = Boolean(req.cookies?.[REFRESH_COOKIE_NAME]);
  if (req.path === "/logout" && !hasRefreshCookie) {
    next();
    return;
  }

  const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];
  const headerToken = req.get("x-csrf-token");

  if (
    typeof cookieToken !== "string" ||
    typeof headerToken !== "string" ||
    !timingSafeMatch(cookieToken, headerToken) ||
    !verifyCsrfToken(cookieToken)
  ) {
    res.status(403).json({
      ok: false,
      error: { code: "CSRF_INVALID", message: "CSRF validation failed" },
    });
    return;
  }

  next();
}
