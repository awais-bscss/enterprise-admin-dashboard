import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

// Load apps/api/.env when started from the repo root in local dev.
if (process.env.NODE_ENV !== "production" && !process.env.MONGODB_URI) {
  const dir = path.dirname(fileURLToPath(import.meta.url));
  const paths = [path.resolve(dir, "../../.env"), path.resolve(dir, "../../../.env")];
  const envPath = paths.find((candidate) => fs.existsSync(candidate));
  if (envPath) {
    dotenv.config({ path: envPath });
  }
}

const optionalString = z
  .string()
  .trim()
  .optional()
  .transform((val) => (val && val.length > 0 ? val : undefined));

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  MONGODB_URI: z.string().trim().min(1, "MONGODB_URI is required"),
  JWT_ACCESS_SECRET: z.string().trim().min(32, "JWT_ACCESS_SECRET must be at least 32 characters"),
  JWT_REFRESH_SECRET: z.string().trim().min(32, "JWT_REFRESH_SECRET must be at least 32 characters"),
  FRONTEND_URL: optionalString,
  CSRF_SECRET: optionalString,
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  const details = result.error.issues
    .map((issue) => `${issue.path.join(".") || "env"}: ${issue.message}`)
    .join("; ");
  throw new Error(`Invalid environment variables: ${details}`);
}

export const env = result.data;
