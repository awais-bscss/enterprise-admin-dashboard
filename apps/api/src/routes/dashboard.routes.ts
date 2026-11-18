import { Router } from "express";
import {
  getActivityTrend,
  getEmployeeStatus,
  getStatusBreakdown,
  getSummary,
  getTrackProgress,
} from "../controllers/dashboard.controller.js";
import { requireAuth, requirePermission } from "../middleware/auth.js";
import { ensureDatabase } from "../middleware/ensureDb.js";

export const dashboardRouter = Router();

dashboardRouter.use(ensureDatabase, requireAuth, requirePermission("users:read"));

dashboardRouter.get("/summary", getSummary);
dashboardRouter.get("/track-progress", getTrackProgress);
dashboardRouter.get("/status-breakdown", getStatusBreakdown);
dashboardRouter.get("/employee-status", getEmployeeStatus);
dashboardRouter.get("/activity-trend", getActivityTrend);
