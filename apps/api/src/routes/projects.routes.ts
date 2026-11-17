import { Router } from "express";
import {
  createProject,
  deleteProject,
  importProjects,
  listProjects,
  updateProject,
} from "../controllers/projects.controller.js";
import { requireAuth, requirePermission } from "../middleware/auth.js";
import { ensureDatabase } from "../middleware/ensureDb.js";

export const projectsRouter = Router();

projectsRouter.use(ensureDatabase, requireAuth);

projectsRouter.get("/", requirePermission("projects:read"), listProjects);
projectsRouter.post("/", requirePermission("projects:write"), createProject);
projectsRouter.post("/import", requirePermission("projects:write"), importProjects);
projectsRouter.patch("/:id", requirePermission("projects:write"), updateProject);
projectsRouter.delete("/:id", requirePermission("projects:write"), deleteProject);
