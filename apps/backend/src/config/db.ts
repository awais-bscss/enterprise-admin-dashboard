import mongoose from "mongoose";
import { env } from "./env.js";

interface DbCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var __mongooseCache: DbCache | undefined;
}

// Cache connection across serverless invocations to prevent pool exhaustion.
const cache: DbCache = globalThis.__mongooseCache ?? { conn: null, promise: null };
globalThis.__mongooseCache = cache;

export type DbStatus = "connected" | "connecting" | "disconnected";

export function getDbStatus(): DbStatus {
  if (mongoose.connection.readyState === 1) return "connected";
  if (mongoose.connection.readyState === 2) return "connecting";
  return "disconnected";
}

export async function connectToDatabase(): Promise<boolean> {
  const readyState = mongoose.connection.readyState;
  if (readyState === 1) return true;

  if (readyState === 0 || readyState === 3) {
    cache.conn = null;
    // Reset stale promise after a disconnect so the next call reconnects.
    cache.promise = null;
  }

  if (!cache.promise) {
    cache.promise = mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 12000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 30000,
      maxPoolSize: 10,
    });
  }

  try {
    cache.conn = await cache.promise;
    return cache.conn.connection.readyState === 1;
  } catch (err) {
    cache.promise = null;
    cache.conn = null;
    const msg = err instanceof Error ? err.message : "Database connection failed";
    console.error(`[db] ${msg}`);
    return false;
  }
}
