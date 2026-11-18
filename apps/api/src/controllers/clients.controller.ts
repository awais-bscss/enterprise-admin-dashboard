import type { Request, Response } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { Client } from "../models/Client.js";
import { ENTITY_STATUSES } from "../models/Department.js";
import { Project } from "../models/Project.js";
import { recordAuditEvent } from "../utils/audit.js";
import { sendApiError } from "../utils/httpErrors.js";
import { parsePaginationParams, resolvePaginatedItems } from "../utils/pagination.js";
import { escapeRegex, summarizeActiveStatus } from "../utils/query.js";

const createClientSchema = z.object({
  name: z.string().trim().min(2, "Contact name must be at least 2 characters").max(80),
  company: z.string().trim().min(2, "Company name must be at least 2 characters").max(100),
  email: z.string().trim().email("Please enter a valid contact email").toLowerCase(),
  phone: z.string().trim().max(30).optional().default(""),
  status: z.enum(ENTITY_STATUSES).optional().default("active"),
});

const updateClientSchema = createClientSchema.partial();

function serializeClient(
  doc: {
    _id: unknown;
    name: string;
    company: string;
    email: string;
    phone: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  },
  projectCount = 0,
) {
  return {
    id: String(doc._id),
    name: doc.name,
    company: doc.company,
    email: doc.email,
    phone: doc.phone,
    status: doc.status as "active" | "inactive",
    projectCount,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export async function listClients(req: Request, res: Response): Promise<void> {
  const query = typeof req.query.q === "string" ? req.query.q.trim() : "";
  const status = typeof req.query.status === "string" ? req.query.status.trim() : "";
  const { page, limit } = parsePaginationParams(req.query as Record<string, unknown>, {
    limit: 10,
    maxLimit: 100,
  });

  const filter: Record<string, unknown> = {};
  if (query) {
    const regex = new RegExp(escapeRegex(query), "i");
    filter.$or = [{ name: regex }, { company: regex }, { email: regex }, { phone: regex }];
  }
  if (ENTITY_STATUSES.includes(status as (typeof ENTITY_STATUSES)[number])) {
    filter.status = status;
  }

  const [stats, projectCountsAgg, { items: clients, pagination }] = await Promise.all([
    summarizeActiveStatus(Client),
    Project.aggregate<{ _id: mongoose.Types.ObjectId; count: number }>([
      { $match: { clientId: { $ne: null } } },
      { $group: { _id: "$clientId", count: { $sum: 1 } } },
    ]),
    resolvePaginatedItems(page, limit, Client.countDocuments(filter), (skip) =>
      Client.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    ),
  ]);

  const projectMap = new Map(projectCountsAgg.map((row) => [String(row._id), row.count]));

  res.status(200).json({
    ok: true,
    data: {
      clients: clients.map((client) =>
        serializeClient(client, projectMap.get(String(client._id)) ?? 0),
      ),
      stats,
      pagination,
    },
  });
}

export async function createClient(req: Request, res: Response): Promise<void> {
  const parsed = createClientSchema.safeParse(req.body);
  if (!parsed.success) {
    sendApiError(
      res,
      400,
      "VALIDATION_ERROR",
      parsed.error.issues[0]?.message ?? "Invalid client payload",
    );
    return;
  }

  const data = parsed.data;
  const duplicate = await Client.exists({ email: data.email });
  if (duplicate) {
    sendApiError(res, 409, "EMAIL_EXISTS", "A client with this email already exists");
    return;
  }

  const clientId = new mongoose.Types.ObjectId();
  const [created] = await Promise.all([
    Client.create({
      _id: clientId,
      ...data,
    }),
    recordAuditEvent({
      actor: req.auth!,
      action: "client.created",
      resourceType: "client",
      resourceId: String(clientId),
      summary: `Added client ${data.name} (${data.company})`,
    }),
  ]);

  res.status(201).json({
    ok: true,
    data: { client: serializeClient(created) },
  });
}

export async function updateClient(req: Request, res: Response): Promise<void> {
  const id = String(req.params.id ?? "");
  if (!mongoose.isValidObjectId(id)) {
    sendApiError(res, 400, "VALIDATION_ERROR", "Invalid client id");
    return;
  }

  const parsed = updateClientSchema.safeParse(req.body);
  if (!parsed.success) {
    sendApiError(
      res,
      400,
      "VALIDATION_ERROR",
      parsed.error.issues[0]?.message ?? "Invalid client update",
    );
    return;
  }

  const existing = await Client.findById(id);
  if (!existing) {
    sendApiError(res, 404, "NOT_FOUND", "Client not found");
    return;
  }

  const patch = parsed.data;
  if (patch.email && patch.email !== existing.email) {
    const duplicate = await Client.exists({ email: patch.email, _id: { $ne: existing._id } });
    if (duplicate) {
      sendApiError(res, 409, "EMAIL_EXISTS", "A client with this email already exists");
      return;
    }
    existing.email = patch.email;
  }

  if (patch.name !== undefined) existing.name = patch.name;
  if (patch.company !== undefined) existing.company = patch.company;
  if (patch.phone !== undefined) existing.phone = patch.phone;
  if (patch.status !== undefined) existing.status = patch.status;

  const [, projectCount] = await Promise.all([
    existing.save(),
    Project.countDocuments({ clientId: existing._id }),
    recordAuditEvent({
      actor: req.auth!,
      action: "client.updated",
      resourceType: "client",
      resourceId: String(existing._id),
      summary: `Updated client ${existing.name} (${existing.company})`,
    }),
  ]);

  res.status(200).json({
    ok: true,
    data: { client: serializeClient(existing, projectCount) },
  });
}

export async function deleteClient(req: Request, res: Response): Promise<void> {
  const id = String(req.params.id ?? "");
  if (!mongoose.isValidObjectId(id)) {
    sendApiError(res, 400, "VALIDATION_ERROR", "Invalid client id");
    return;
  }

  const deleted = await Client.findByIdAndDelete(id).select("name company").lean();
  if (!deleted) {
    sendApiError(res, 404, "NOT_FOUND", "Client not found");
    return;
  }

  await Promise.all([
    Project.updateMany({ clientId: deleted._id }, { $set: { clientId: null } }),
    recordAuditEvent({
      actor: req.auth!,
      action: "client.deleted",
      resourceType: "client",
      resourceId: String(deleted._id),
      summary: `Removed client ${deleted.name} (${deleted.company})`,
    }),
  ]);

  res.status(200).json({ ok: true, data: { deletedId: String(deleted._id) } });
}
