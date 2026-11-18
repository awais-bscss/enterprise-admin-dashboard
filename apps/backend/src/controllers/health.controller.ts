import mongoose from "mongoose";
import type { Request, Response } from "express";
import { connectToDatabase, getDbStatus } from "../config/db.js";
import { env } from "../config/env.js";
import { User } from "../models/User.js";

export async function getHealth(req: Request, res: Response): Promise<void> {
  const connected = await connectToDatabase();
  if (connected && req.query.warm === "1") {
    // Prime the User model and index-lookup path so login runs on a warm query handle.
    await User.findOne({ _id: new mongoose.Types.ObjectId() })
      .select("_id")
      .lean()
      .catch(() => undefined);
  }

  res.status(200).json({
    ok: true,
    service: "enterprise-admin-api",
    db: getDbStatus(),
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
}
