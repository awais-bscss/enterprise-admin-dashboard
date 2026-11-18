import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env.js";

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const isCors = err.message === "Origin not allowed by CORS";
  const status = isCors ? 403 : 500;
  const code = isCors ? "CORS_FORBIDDEN" : "INTERNAL_SERVER_ERROR";
  const message =
    isCors || env.NODE_ENV !== "production" ? err.message : "Something went wrong";

  if (status >= 500) {
    console.error(`[api] ${err.message}`);
  }

  res.status(status).json({
    ok: false,
    error: { code, message },
  });
}
