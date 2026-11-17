import mongoose, { type InferSchemaType } from "mongoose";
import { ROLES, type Role } from "../config/rbac.js";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, default: "viewer", required: true },
    status: { type: String, enum: ["active", "suspended"], default: "active", required: true },
  },
  { timestamps: true },
);

userSchema.index({ createdAt: -1 });

export type UserRecord = InferSchemaType<typeof userSchema> & {
  _id: mongoose.Types.ObjectId;
  role: Role;
};

export const User = mongoose.model("User", userSchema);
