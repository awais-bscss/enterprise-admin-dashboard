import mongoose, { type InferSchemaType } from "mongoose";

const workspaceSettingSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: "default" },
    organizationName: { type: String, required: true, trim: true, default: "Veridian Enterprise" },
    defaultNewUserRole: {
      type: String,
      enum: ["manager", "viewer"],
      default: "viewer",
      required: true,
    },
    sessionTimeoutMinutes: { type: Number, min: 5, max: 120, default: 15, required: true },
    enforceStrongPasswords: { type: Boolean, default: true, required: true },
    auditRetentionDays: { type: Number, min: 7, max: 365, default: 90, required: true },
    updatedByName: { type: String, trim: true, default: "System" },
  },
  { timestamps: true },
);

export type WorkspaceSettingRecord = InferSchemaType<typeof workspaceSettingSchema>;

export const WorkspaceSetting = mongoose.model("WorkspaceSetting", workspaceSettingSchema);
