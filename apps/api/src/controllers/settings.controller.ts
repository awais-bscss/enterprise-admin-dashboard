import type { Request, Response } from "express";
import { z } from "zod";
import { WorkspaceSetting } from "../models/WorkspaceSetting.js";
import { recordAuditEvent } from "../utils/audit.js";
import { sendApiError } from "../utils/httpErrors.js";

const updateSettingsSchema = z.object({
  organizationName: z.string().trim().min(2).max(80).optional(),
  defaultNewUserRole: z.enum(["manager", "viewer"]).optional(),
  sessionTimeoutMinutes: z.coerce.number().int().min(5).max(120).optional(),
  enforceStrongPasswords: z.boolean().optional(),
  auditRetentionDays: z.coerce.number().int().min(7).max(365).optional(),
});

async function getOrCreateSettings() {
  return WorkspaceSetting.findOneAndUpdate(
    { key: "default" },
    { $setOnInsert: { key: "default" } },
    { upsert: true, returnDocument: "after" },
  ).lean();
}

export async function getSettings(_req: Request, res: Response): Promise<void> {
  const settings = await getOrCreateSettings();
  res.status(200).json({
    ok: true,
    data: {
      settings: {
        organizationName: settings.organizationName,
        defaultNewUserRole: settings.defaultNewUserRole,
        sessionTimeoutMinutes: settings.sessionTimeoutMinutes,
        enforceStrongPasswords: settings.enforceStrongPasswords,
        auditRetentionDays: settings.auditRetentionDays,
        updatedByName: settings.updatedByName,
        updatedAt: settings.updatedAt.toISOString(),
      },
    },
  });
}

export async function updateSettings(req: Request, res: Response): Promise<void> {
  const parsed = updateSettingsSchema.safeParse(req.body);
  if (!parsed.success) {
    sendApiError(
      res,
      400,
      "VALIDATION_ERROR",
      parsed.error.issues[0]?.message ?? "Invalid settings payload",
    );
    return;
  }

  const updated = await WorkspaceSetting.findOneAndUpdate(
    { key: "default" },
    {
      $set: {
        ...parsed.data,
        updatedByName: req.auth!.name,
      },
      $setOnInsert: { key: "default" },
    },
    { upsert: true, returnDocument: "after" },
  ).lean();

  await recordAuditEvent({
    actor: req.auth!,
    action: "settings.updated",
    resourceType: "settings",
    resourceId: "default",
    summary: `Updated organization policy (${updated.organizationName})`,
  });

  res.status(200).json({
    ok: true,
    data: {
      settings: {
        organizationName: updated.organizationName,
        defaultNewUserRole: updated.defaultNewUserRole,
        sessionTimeoutMinutes: updated.sessionTimeoutMinutes,
        enforceStrongPasswords: updated.enforceStrongPasswords,
        auditRetentionDays: updated.auditRetentionDays,
        updatedByName: updated.updatedByName,
        updatedAt: updated.updatedAt.toISOString(),
      },
    },
  });
}
