import { Router } from "express";
import { createUser, deleteUser, listUsers, updateUser } from "../controllers/users.controller.js";
import { requireAuth, requirePermission } from "../middleware/auth.js";
import { ensureDatabase } from "../middleware/ensureDb.js";

export const usersRouter = Router();

usersRouter.use(ensureDatabase, requireAuth);

usersRouter.get("/", requirePermission("users:read"), listUsers);
usersRouter.post("/", requirePermission("users:write"), createUser);
usersRouter.patch("/:id", requirePermission("users:write"), updateUser);
usersRouter.delete("/:id", requirePermission("users:write"), deleteUser);
