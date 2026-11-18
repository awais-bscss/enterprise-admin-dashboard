import mongoose, { type InferSchemaType } from "mongoose";
import { ENTITY_STATUSES } from "./Department.js";

const clientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    company: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true },
    phone: { type: String, trim: true, maxlength: 30, default: "" },
    status: { type: String, enum: ENTITY_STATUSES, default: "active", required: true },
  },
  { timestamps: true },
);

clientSchema.index({ createdAt: -1 });
clientSchema.index({ status: 1, createdAt: -1 });

export type ClientRecord = InferSchemaType<typeof clientSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Client = mongoose.model("Client", clientSchema);
