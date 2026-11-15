import type { Request, Response } from "express";
import { connectToDatabase, getDbStatus } from "../config/db.js";
import { env } from "../config/env.js";

export async function getHealth(_req: Request, res: Response): Promise<void> {
  await connectToDatabase();

  res.status(200).json({
    ok: true,
    service: "enterprise-admin-api",
    db: getDbStatus(),
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
}
