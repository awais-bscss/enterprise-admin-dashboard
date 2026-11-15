import { Router } from "express";
import { listAuditLogs } from "../controllers/audit.controller.js";
import { requireAuth, requirePermission } from "../middleware/auth.js";
import { ensureDatabase } from "../middleware/ensureDb.js";

export const auditRouter = Router();

auditRouter.use(ensureDatabase, requireAuth);

auditRouter.get("/", requirePermission("audit:read"), listAuditLogs);
