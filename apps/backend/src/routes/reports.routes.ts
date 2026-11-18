import { Router } from "express";
import { exportComplianceReport } from "../controllers/reports.controller.js";
import { requireAuth, requirePermission } from "../middleware/auth.js";
import { ensureDatabase } from "../middleware/ensureDb.js";

export const reportsRouter = Router();

reportsRouter.use(ensureDatabase, requireAuth);

reportsRouter.get("/export", requirePermission("reports:export"), exportComplianceReport);
