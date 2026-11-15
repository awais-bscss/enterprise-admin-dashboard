import mongoose, { type InferSchemaType } from "mongoose";

export const PROJECT_CATEGORIES = ["development", "design", "testing", "security"] as const;
export type ProjectCategory = (typeof PROJECT_CATEGORIES)[number];

export const PROJECT_STATUSES = ["upcoming", "in_progress", "completed"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const PROJECT_PRIORITIES = ["low", "medium", "high"] as const;
export type ProjectPriority = (typeof PROJECT_PRIORITIES)[number];

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, trim: true, maxlength: 500, default: "" },
    category: { type: String, enum: PROJECT_CATEGORIES, default: "development", required: true },
    status: { type: String, enum: PROJECT_STATUSES, default: "in_progress", required: true },
    progress: { type: Number, min: 0, max: 100, default: 0, required: true },
    tasksTotal: { type: Number, min: 0, default: 1, required: true },
    tasksCompleted: { type: Number, min: 0, default: 0, required: true },
    priority: { type: String, enum: PROJECT_PRIORITIES, default: "medium", required: true },
    dueDate: { type: Date, default: null },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  },
  { timestamps: true },
);

export type ProjectRecord = InferSchemaType<typeof projectSchema> & {
  _id: mongoose.Types.ObjectId;
};

export const Project = mongoose.model("Project", projectSchema);
