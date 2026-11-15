import type { NextFunction, Request, Response } from "express";
import { connectToDatabase } from "../config/db.js";

export async function ensureDatabase(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const connected = await connectToDatabase();
  if (!connected) {
    res.status(503).json({
      ok: false,
      error: {
        code: "DB_UNAVAILABLE",
        message: "Database connection unavailable",
      },
    });
    return;
  }
  next();
}
