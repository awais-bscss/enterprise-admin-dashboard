import { Router } from "express";
import {
  createClient,
  deleteClient,
  listClients,
  updateClient,
} from "../controllers/clients.controller.js";
import { requireAuth, requirePermission } from "../middleware/auth.js";
import { ensureDatabase } from "../middleware/ensureDb.js";

export const clientsRouter = Router();

clientsRouter.use(ensureDatabase, requireAuth);

clientsRouter.get("/", requirePermission("clients:read"), listClients);
clientsRouter.post("/", requirePermission("clients:write"), createClient);
clientsRouter.patch("/:id", requirePermission("clients:write"), updateClient);
clientsRouter.delete("/:id", requirePermission("clients:write"), deleteClient);
