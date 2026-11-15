import type { Request, Response } from "express";
import { AUDIT_RESOURCES, AuditLog } from "../models/AuditLog.js";

export async function listAuditLogs(req: Request, res: Response): Promise<void> {
  const resourceType =
    typeof req.query.resourceType === "string" ? req.query.resourceType.trim() : "";
  const limitRaw = Number(req.query.limit ?? 50);
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(Math.trunc(limitRaw), 1), 100) : 50;

  const filter: Record<string, unknown> = {};
  if (AUDIT_RESOURCES.includes(resourceType as (typeof AUDIT_RESOURCES)[number])) {
    filter.resourceType = resourceType;
  }

  const logs = await AuditLog.find(filter).sort({ createdAt: -1 }).limit(limit).lean();

  res.status(200).json({
    ok: true,
    data: {
      logs: logs.map((entry) => ({
        id: String(entry._id),
        actorName: entry.actorName,
        actorEmail: entry.actorEmail,
        actorRole: entry.actorRole,
        action: entry.action,
        resourceType: entry.resourceType,
        resourceId: entry.resourceId,
        summary: entry.summary,
        createdAt: entry.createdAt.toISOString(),
      })),
    },
  });
}
