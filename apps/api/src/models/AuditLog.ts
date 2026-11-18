import mongoose, { type InferSchemaType } from "mongoose";

export const AUDIT_RESOURCES = [
  "auth",
  "project",
  "department",
  "client",
  "user",
  "report",
] as const;
export type AuditResource = (typeof AUDIT_RESOURCES)[number];

const auditLogSchema = new mongoose.Schema(
  {
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    actorName: { type: String, required: true, trim: true },
    actorEmail: { type: String, required: true, trim: true, lowercase: true },
    actorRole: { type: String, required: true, trim: true },
    action: { type: String, required: true, trim: true, index: true },
    resourceType: { type: String, enum: AUDIT_RESOURCES, required: true, index: true },
    resourceId: { type: String, default: null },
    summary: { type: String, required: true, trim: true, maxlength: 240 },
  },
  { timestamps: true },
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ resourceType: 1, createdAt: -1 });

export type AuditLogRecord = InferSchemaType<typeof auditLogSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const AuditLog = mongoose.model("AuditLog", auditLogSchema);
