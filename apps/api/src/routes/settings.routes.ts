import { Router } from "express";
import { getSettings, updateSettings } from "../controllers/settings.controller.js";
import { requireAuth, requirePermission } from "../middleware/auth.js";
import { ensureDatabase } from "../middleware/ensureDb.js";

export const settingsRouter = Router();

settingsRouter.use(ensureDatabase, requireAuth);

settingsRouter.get("/", requirePermission("settings:manage"), getSettings);
settingsRouter.patch("/", requirePermission("settings:manage"), updateSettings);
