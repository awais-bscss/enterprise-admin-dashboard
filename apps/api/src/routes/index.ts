import { Router } from "express";
import { auditRouter } from "./audit.routes.js";
import { authRouter } from "./auth.routes.js";
import { clientsRouter } from "./clients.routes.js";
import { dashboardRouter } from "./dashboard.routes.js";
import { departmentsRouter } from "./departments.routes.js";
import { healthRouter } from "./health.routes.js";
import { projectsRouter } from "./projects.routes.js";
import { reportsRouter } from "./reports.routes.js";
import { usersRouter } from "./users.routes.js";

export const apiRouter = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/dashboard", dashboardRouter);
apiRouter.use("/projects", projectsRouter);
apiRouter.use("/departments", departmentsRouter);
apiRouter.use("/clients", clientsRouter);
apiRouter.use("/users", usersRouter);
apiRouter.use("/audit", auditRouter);
apiRouter.use("/reports", reportsRouter);
