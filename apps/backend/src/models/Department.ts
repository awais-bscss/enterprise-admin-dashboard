import mongoose, { type InferSchemaType } from "mongoose";

export const ENTITY_STATUSES = ["active", "inactive"] as const;
export type EntityStatus = (typeof ENTITY_STATUSES)[number];

const departmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    code: { type: String, required: true, trim: true, uppercase: true, unique: true, maxlength: 16 },
    headName: { type: String, required: true, trim: true, maxlength: 80 },
    description: { type: String, trim: true, maxlength: 300, default: "" },
    status: { type: String, enum: ENTITY_STATUSES, default: "active", required: true },
  },
  { timestamps: true },
);

departmentSchema.index({ createdAt: -1 });
departmentSchema.index({ status: 1, createdAt: -1 });

export type DepartmentRecord = InferSchemaType<typeof departmentSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Department = mongoose.model("Department", departmentSchema);
