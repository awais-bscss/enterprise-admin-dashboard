import { Router } from "express";
import {
  createDepartment,
  deleteDepartment,
  listDepartments,
  updateDepartment,
} from "../controllers/departments.controller.js";
import { requireAuth, requirePermission } from "../middleware/auth.js";
import { ensureDatabase } from "../middleware/ensureDb.js";

export const departmentsRouter = Router();

departmentsRouter.use(ensureDatabase, requireAuth);

departmentsRouter.get("/", requirePermission("departments:read"), listDepartments);
departmentsRouter.post("/", requirePermission("departments:write"), createDepartment);
departmentsRouter.patch("/:id", requirePermission("departments:write"), updateDepartment);
departmentsRouter.delete("/:id", requirePermission("departments:write"), deleteDepartment);
