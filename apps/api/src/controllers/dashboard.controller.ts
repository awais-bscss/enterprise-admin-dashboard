import type { Request, Response } from "express";
import { RefreshToken } from "../models/RefreshToken.js";
import { User } from "../models/User.js";

export async function getOverview(req: Request, res: Response): Promise<void> {
  const auth = req.auth!;
  const [totalUsers, activeUsers] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ status: "active" }),
  ]);

  let activeSessions: number | null = null;
  if (auth.permissions.includes("audit:read")) {
    activeSessions = await RefreshToken.countDocuments({
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    });
  }

  res.status(200).json({
    ok: true,
    data: {
      stats: {
        totalUsers,
        activeUsers,
        activeSessions,
      },
      role: auth.role,
      permissions: auth.permissions,
    },
  });
}
