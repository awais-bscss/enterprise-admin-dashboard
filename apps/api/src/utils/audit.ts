import type { AuthContext } from "../middleware/auth.js";
import { AuditLog, type AuditResource } from "../models/AuditLog.js";

interface AuditEventInput {
  actor: Pick<AuthContext, "userId" | "name" | "email" | "role">;
  action: string;
  resourceType: AuditResource;
  resourceId?: string | null;
  summary: string;
}

export async function recordAuditEvent(input: AuditEventInput): Promise<void> {
  try {
    await AuditLog.create({
      actorId: input.actor.userId,
      actorName: input.actor.name,
      actorEmail: input.actor.email,
      actorRole: input.actor.role,
      action: input.action,
      resourceType: input.resourceType,
      resourceId: input.resourceId ?? null,
      summary: input.summary,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to write audit log";
    console.error(`[audit] ${message}`);
  }
}
