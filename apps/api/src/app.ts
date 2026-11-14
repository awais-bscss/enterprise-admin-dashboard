import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { connectToDatabase, getDbStatus } from "./config/db.js";
import { env } from "./config/env.js";

const DEV_ORIGINS = ["http://localhost:5173", "http://127.0.0.1:5173"];

function buildAllowedOrigins(): Set<string> {
  const origins = new Set<string>();

  if (env.NODE_ENV !== "production") {
    for (const origin of DEV_ORIGINS) {
      origins.add(origin);
    }
  }

  if (env.FRONTEND_URL) {
    for (const entry of env.FRONTEND_URL.split(",")) {
      const trimmed = entry.trim();
      if (trimmed.length > 0) {
        origins.add(trimmed);
      }
    }
  }

  return origins;
}

const allowedOrigins = buildAllowedOrigins();

export const app = express();

// Required when running behind reverse proxies (e.g., Vercel) so req.ip and Secure cookies work reliably.
app.set("trust proxy", 1);
app.disable("x-powered-by");

app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("Origin not allowed by CORS"));
    },
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(express.json({ limit: "100kb" }));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skip: (req) => req.path === "/health",
});

app.use("/api", apiLimiter);

app.get("/api/health", async (req: Request, res: Response) => {
  await connectToDatabase();
  const db = getDbStatus();
  let probeCookieSet = false;

  // Temporary probe for reverse-proxy Set-Cookie verification; remove after proxy test passes.
  if (req.query.setTestCookie === "1") {
    res.cookie("proxy_probe", "ok", {
      httpOnly: true,
      sameSite: "lax",
      secure: env.NODE_ENV === "production",
      path: "/api",
      maxAge: 5 * 60 * 1000,
    });
    probeCookieSet = true;
  }

  res.status(200).json({
    ok: true,
    service: "enterprise-admin-api",
    db,
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
    ...(probeCookieSet ? { probeCookieSet: true } : {}),
  });
});

app.use((_req: Request, res: Response) => {
  res.status(404).json({
    ok: false,
    error: {
      code: "NOT_FOUND",
      message: "Route not found",
    },
  });
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  const isCorsError = err.message === "Origin not allowed by CORS";
  const statusCode = isCorsError ? 403 : 500;
  const code = isCorsError ? "CORS_FORBIDDEN" : "INTERNAL_SERVER_ERROR";
  const message =
    isCorsError || env.NODE_ENV !== "production"
      ? err.message
      : "An unexpected error occurred";

  if (statusCode >= 500) {
    console.error(`[api] Unhandled error: ${err.message}`);
  }

  res.status(statusCode).json({
    ok: false,
    error: { code, message },
  });
});

export default app;
