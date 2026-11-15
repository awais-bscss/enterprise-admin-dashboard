import type { Response } from "express";

export function sendApiError(
  res: Response,
  status: number,
  code: string,
  message: string,
): void {
  res.status(status).json({
    ok: false,
    error: { code, message },
  });
}
