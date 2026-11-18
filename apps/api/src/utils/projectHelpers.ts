import mongoose from "mongoose";
import { z } from "zod";
import { Client } from "../models/Client.js";
import { Department } from "../models/Department.js";
import { PROJECT_PRIORITIES, PROJECT_STATUSES } from "../models/Project.js";
import { User } from "../models/User.js";
import { escapeRegex } from "./query.js";

const optionalObjectIdString = z.string().trim().optional().nullable();

export const createProjectSchema = z.object({
  name: z.string().trim().min(2, "Project name must be at least 2 characters").max(100),
  description: z.string().trim().max(500).optional().default(""),
  departmentId: optionalObjectIdString,
  clientId: optionalObjectIdString,
  status: z.enum(PROJECT_STATUSES).default("in_progress"),
  priority: z.enum(PROJECT_PRIORITIES).default("medium"),
  progress: z.coerce.number().int().min(0).max(100).default(0),
  ownerId: z.string().trim().optional(),
  memberIds: z.array(z.string().trim()).optional().default([]),
  dueDate: z
    .string()
    .trim()
    .optional()
    .nullable()
    .transform((val) => (val ? new Date(val) : null)),
});

export const updateProjectSchema = createProjectSchema.partial();

export interface PopulatedOwner {
  _id: string | mongoose.Types.ObjectId;
  name: string;
  email: string;
  role: string;
}

export interface PopulatedDepartment {
  _id: string | mongoose.Types.ObjectId;
  name: string;
  code: string;
}

export interface PopulatedClient {
  _id: string | mongoose.Types.ObjectId;
  name: string;
  company: string;
}

export function resolveProgress(status: (typeof PROJECT_STATUSES)[number], progress = 0): number {
  if (status === "completed") return 100;
  return Math.max(0, Math.min(100, Math.round(progress)));
}

function serializeMemberSummary(doc: PopulatedOwner) {
  return {
    id: String(doc._id),
    name: doc.name,
    email: doc.email,
    role: doc.role,
  };
}

export interface SerializedProjectInput {
  _id: unknown;
  name: string;
  description: string;
  departmentId?: PopulatedDepartment | mongoose.Types.ObjectId | null;
  clientId?: PopulatedClient | mongoose.Types.ObjectId | null;
  status: string;
  progress: number;
  priority: string;
  dueDate: Date | null;
  ownerId: PopulatedOwner | mongoose.Types.ObjectId;
  memberIds?: Array<PopulatedOwner | mongoose.Types.ObjectId>;
  createdAt: Date;
  updatedAt: Date;
}

export function serializeProject(doc: SerializedProjectInput) {
  const owner =
    doc.ownerId && typeof doc.ownerId === "object" && "email" in doc.ownerId
      ? serializeMemberSummary(doc.ownerId)
      : { id: String(doc.ownerId), name: "Workspace Member", email: "", role: "viewer" };

  const members = Array.isArray(doc.memberIds)
    ? doc.memberIds
        .filter(
          (member): member is PopulatedOwner =>
            Boolean(member) &&
            typeof member === "object" &&
            "email" in member &&
            String(member._id) !== owner.id,
        )
        .map(serializeMemberSummary)
    : [];

  const department =
    doc.departmentId && typeof doc.departmentId === "object" && "name" in doc.departmentId
      ? {
          id: String(doc.departmentId._id),
          name: doc.departmentId.name,
          code: doc.departmentId.code,
        }
      : null;

  const client =
    doc.clientId && typeof doc.clientId === "object" && "company" in doc.clientId
      ? {
          id: String(doc.clientId._id),
          name: doc.clientId.name,
          company: doc.clientId.company,
        }
      : null;

  return {
    id: String(doc._id),
    name: doc.name,
    description: doc.description,
    department,
    client,
    status: doc.status,
    progress: doc.progress,
    priority: doc.priority,
    dueDate: doc.dueDate ? doc.dueDate.toISOString() : null,
    owner,
    members,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export function buildProjectFilter(params: {
  q?: string;
  departmentId?: string;
  clientId?: string;
  ownerId?: string;
  status?: string;
}): Record<string, unknown> {
  const conditions: Record<string, unknown>[] = [];
  if (params.q) {
    const regex = new RegExp(escapeRegex(params.q), "i");
    conditions.push({ $or: [{ name: regex }, { description: regex }] });
  }
  if (params.departmentId && mongoose.isValidObjectId(params.departmentId)) {
    conditions.push({ departmentId: new mongoose.Types.ObjectId(params.departmentId) });
  }
  if (params.clientId && mongoose.isValidObjectId(params.clientId)) {
    conditions.push({ clientId: new mongoose.Types.ObjectId(params.clientId) });
  }
  if (params.ownerId && mongoose.isValidObjectId(params.ownerId)) {
    const empObjectId = new mongoose.Types.ObjectId(params.ownerId);
    conditions.push({ $or: [{ ownerId: empObjectId }, { memberIds: empObjectId }] });
  }
  if (
    params.status &&
    PROJECT_STATUSES.includes(params.status as (typeof PROJECT_STATUSES)[number])
  ) {
    conditions.push({ status: params.status });
  }
  return conditions.length > 0 ? { $and: conditions } : {};
}

export function buildProjectListPipeline(
  filter: Record<string, unknown>,
  sort: string,
  skip: number,
  limit: number,
): mongoose.PipelineStage[] {
  const sortStages: mongoose.PipelineStage[] =
    sort === "deadline"
      ? [
          {
            $addFields: {
              missingDueDate: { $cond: [{ $ne: ["$dueDate", null] }, 0, 1] },
            },
          },
          { $sort: { missingDueDate: 1, dueDate: 1, updatedAt: -1 } },
        ]
      : sort === "newest"
        ? [{ $sort: { createdAt: -1 } }]
        : sort === "progress"
          ? [{ $sort: { progress: -1, updatedAt: -1 } }]
          : [{ $sort: { updatedAt: -1 } }];

  return [
    { $match: filter },
    ...sortStages,
    { $skip: skip },
    { $limit: limit },
    {
      $lookup: {
        from: User.collection.name,
        localField: "ownerId",
        foreignField: "_id",
        pipeline: [{ $project: { _id: 1, name: 1, email: 1, role: 1 } }],
        as: "ownerDocs",
      },
    },
    {
      $lookup: {
        from: User.collection.name,
        localField: "memberIds",
        foreignField: "_id",
        pipeline: [{ $project: { _id: 1, name: 1, email: 1, role: 1 } }],
        as: "memberDocs",
      },
    },
    {
      $lookup: {
        from: Department.collection.name,
        localField: "departmentId",
        foreignField: "_id",
        pipeline: [{ $project: { _id: 1, name: 1, code: 1 } }],
        as: "departmentDocs",
      },
    },
    {
      $lookup: {
        from: Client.collection.name,
        localField: "clientId",
        foreignField: "_id",
        pipeline: [{ $project: { _id: 1, name: 1, company: 1 } }],
        as: "clientDocs",
      },
    },
    {
      $set: {
        ownerId: { $ifNull: [{ $arrayElemAt: ["$ownerDocs", 0] }, "$ownerId"] },
        memberIds: "$memberDocs",
        departmentId: { $ifNull: [{ $arrayElemAt: ["$departmentDocs", 0] }, null] },
        clientId: { $ifNull: [{ $arrayElemAt: ["$clientDocs", 0] }, null] },
      },
    },
    { $unset: ["ownerDocs", "memberDocs", "departmentDocs", "clientDocs", "missingDueDate"] },
  ];
}

export async function resolveActiveMembers(
  rawIds: readonly string[],
  leadUserId: string,
): Promise<{ docs: PopulatedOwner[]; error: string | null }> {
  const uniqueIds = Array.from(new Set(rawIds.map((id) => id.trim()).filter(Boolean))).filter(
    (id) => id !== leadUserId,
  );
  if (uniqueIds.length === 0) {
    return { docs: [], error: null };
  }
  if (uniqueIds.some((id) => !mongoose.isValidObjectId(id))) {
    return { docs: [], error: "Invalid team member id" };
  }

  const docs = await User.find({ _id: { $in: uniqueIds }, status: "active" })
    .select("_id name email role")
    .lean();

  if (docs.length !== uniqueIds.length) {
    return { docs: [], error: "One or more selected team members are unavailable" };
  }

  const byId = new Map(docs.map((doc) => [String(doc._id), doc as unknown as PopulatedOwner]));
  return {
    docs: uniqueIds.map((id) => byId.get(id)!),
    error: null,
  };
}

export async function resolveProjectReferences(input: {
  dueDate?: Date | null;
  ownerId?: string;
  departmentId?: string | null;
  clientId?: string | null;
  lookupOwner?: boolean;
}): Promise<{
  error?: string;
  ownerDoc: PopulatedOwner | null;
  departmentDoc: PopulatedDepartment | null;
  clientDoc: PopulatedClient | null;
}> {
  if (input.dueDate && Number.isNaN(input.dueDate.getTime())) {
    return { error: "Invalid due date format", ownerDoc: null, departmentDoc: null, clientDoc: null };
  }
  if (input.ownerId && !mongoose.isValidObjectId(input.ownerId)) {
    return { error: "Invalid owner user id", ownerDoc: null, departmentDoc: null, clientDoc: null };
  }
  if (input.departmentId && !mongoose.isValidObjectId(input.departmentId)) {
    return { error: "Invalid department id", ownerDoc: null, departmentDoc: null, clientDoc: null };
  }
  if (input.clientId && !mongoose.isValidObjectId(input.clientId)) {
    return { error: "Invalid client id", ownerDoc: null, departmentDoc: null, clientDoc: null };
  }

  const shouldLookupOwner = Boolean(input.ownerId) && (input.lookupOwner ?? true);
  const [ownerDoc, departmentDoc, clientDoc] = await Promise.all([
    shouldLookupOwner
      ? User.findOne({ _id: input.ownerId, status: "active" })
          .select("_id name email role")
          .lean()
      : Promise.resolve(null),
    input.departmentId
      ? Department.findById(input.departmentId).select("_id name code").lean()
      : Promise.resolve(null),
    input.clientId
      ? Client.findById(input.clientId).select("_id name company").lean()
      : Promise.resolve(null),
  ]);

  if (shouldLookupOwner && !ownerDoc) {
    return {
      error: "Selected project owner is unavailable",
      ownerDoc: null,
      departmentDoc: null,
      clientDoc: null,
    };
  }
  if (input.departmentId && !departmentDoc) {
    return {
      error: "Selected department is unavailable",
      ownerDoc: null,
      departmentDoc: null,
      clientDoc: null,
    };
  }
  if (input.clientId && !clientDoc) {
    return {
      error: "Selected client is unavailable",
      ownerDoc: null,
      departmentDoc: null,
      clientDoc: null,
    };
  }

  return {
    ownerDoc: ownerDoc as unknown as PopulatedOwner | null,
    departmentDoc: departmentDoc as unknown as PopulatedDepartment | null,
    clientDoc: clientDoc as unknown as PopulatedClient | null,
  };
}
