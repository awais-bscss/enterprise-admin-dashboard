import type { CorsOptions } from "cors";
import { env } from "./env.js";

const DEV_ORIGINS = ["http://localhost:5173", "http://127.0.0.1:5173"];

function getAllowedOrigins(): Set<string> {
  const origins = new Set<string>();

  if (env.NODE_ENV !== "production") {
    DEV_ORIGINS.forEach((origin) => origins.add(origin));
  }

  if (env.FRONTEND_URL) {
    env.FRONTEND_URL.split(",")
      .map((item) => item.trim().replace(/\/+$/, ""))
      .filter(Boolean)
      .forEach((origin) => origins.add(origin));
  }

  return origins;
}

const allowedOrigins = getAllowedOrigins();

export function isAllowedOrigin(origin: string): boolean {
  return allowedOrigins.has(origin);
}

export const corsOptions: CorsOptions = {
  origin(origin, callback) {
    if (!origin || isAllowedOrigin(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error("Origin not allowed by CORS"));
  },
  credentials: true,
};
