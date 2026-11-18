import mongoose, { type InferSchemaType } from "mongoose";

export const PROJECT_STATUSES = ["upcoming", "in_progress", "completed"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const PROJECT_PRIORITIES = ["low", "medium", "high"] as const;
export type ProjectPriority = (typeof PROJECT_PRIORITIES)[number];

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, trim: true, maxlength: 500, default: "" },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      default: null,
      index: true,
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      default: null,
      index: true,
    },
    status: { type: String, enum: PROJECT_STATUSES, default: "in_progress", required: true },
    progress: { type: Number, min: 0, max: 100, default: 0, required: true },
    priority: { type: String, enum: PROJECT_PRIORITIES, default: "medium", required: true },
    dueDate: { type: Date, default: null },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    memberIds: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      default: [],
      index: true,
    },
  },
  { timestamps: true },
);

projectSchema.index({ updatedAt: -1 });
projectSchema.index({ status: 1, departmentId: 1, updatedAt: -1 });
projectSchema.index({ createdAt: -1 });

export type ProjectRecord = InferSchemaType<typeof projectSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Project = mongoose.model("Project", projectSchema);
