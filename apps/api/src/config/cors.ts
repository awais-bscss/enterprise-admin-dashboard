import type { CorsOptions } from "cors";
import { env } from "./env.js";

const LOCAL_DEV_ORIGIN_RE = /^http:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?$/;

function getConfiguredOrigins(): Set<string> {
  const origins = new Set<string>();

  if (env.FRONTEND_URL) {
    env.FRONTEND_URL.split(",")
      .map((item) => item.trim().replace(/\/+$/, ""))
      .filter(Boolean)
      .forEach((origin) => origins.add(origin));
  }

  return origins;
}

const configuredOrigins = getConfiguredOrigins();

export function isAllowedOrigin(origin: string): boolean {
  if (env.NODE_ENV !== "production" && LOCAL_DEV_ORIGIN_RE.test(origin)) {
    return true;
  }
  return configuredOrigins.has(origin);
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
