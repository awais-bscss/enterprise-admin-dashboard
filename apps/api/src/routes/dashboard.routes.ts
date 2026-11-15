import { Router } from "express";
import { getOverview } from "../controllers/dashboard.controller.js";
import { requireAuth, requirePermission } from "../middleware/auth.js";
import { ensureDatabase } from "../middleware/ensureDb.js";

export const dashboardRouter = Router();

dashboardRouter.use(ensureDatabase, requireAuth);

dashboardRouter.get("/overview", requirePermission("users:read"), getOverview);
