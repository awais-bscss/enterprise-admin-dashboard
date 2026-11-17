import type { Request, Response } from "express";
import { AUDIT_RESOURCES, AuditLog } from "../models/AuditLog.js";
import { parsePaginationParams, resolvePaginationWindow } from "../utils/pagination.js";

export async function listAuditLogs(req: Request, res: Response): Promise<void> {
  const resourceType =
    typeof req.query.resourceType === "string" ? req.query.resourceType.trim() : "";
  const { page, limit } = parsePaginationParams(req.query as Record<string, unknown>, {
    limit: 12,
    maxLimit: 100,
  });

  const filter: Record<string, unknown> = {};
  if (AUDIT_RESOURCES.includes(resourceType as (typeof AUDIT_RESOURCES)[number])) {
    filter.resourceType = resourceType;
  }

  const total = await AuditLog.countDocuments(filter);
  const { skip, pagination } = resolvePaginationWindow(page, limit, total);
  const logs = await AuditLog.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

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
      pagination,
    },
  });
}
