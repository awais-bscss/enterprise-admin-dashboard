import { Router } from "express";
import { login, logout, me, refresh, updateProfile } from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { requireCsrf } from "../middleware/csrf.js";
import { ensureDatabase } from "../middleware/ensureDb.js";
import { authRateLimiter } from "../middleware/rateLimiter.js";

export const authRouter = Router();

authRouter.use(ensureDatabase);

authRouter.post("/login", authRateLimiter, login);
authRouter.post("/refresh", authRateLimiter, requireCsrf, refresh);
authRouter.post("/logout", requireCsrf, logout);
authRouter.get("/me", requireAuth, me);
authRouter.patch("/profile", requireAuth, updateProfile);
