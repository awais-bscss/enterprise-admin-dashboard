import mongoose from "mongoose";
import { env } from "./env.js";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var __mongooseCache: MongooseCache | undefined;
}

const cache: MongooseCache = globalThis.__mongooseCache ?? {
  conn: null,
  promise: null,
};

globalThis.__mongooseCache = cache;

export type DbHealthStatus = "connected" | "connecting" | "disconnected";

/**
 * Returns the current Mongoose connection readiness state.
 */
export function getDbStatus(): DbHealthStatus {
  switch (mongoose.connection.readyState) {
    case 1:
      return "connected";
    case 2:
      return "connecting";
    default:
      return "disconnected";
  }
}

/**
 * Connects to MongoDB using a global promise cache safe for serverless reuse.
 * Returns true if connected, or false if the connection fails so health probes can still respond.
 */
export async function connectToDatabase(): Promise<boolean> {
  if (mongoose.connection.readyState === 1) {
    return true;
  }

  if (!cache.promise) {
    cache.promise = mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 10,
    });
  }

  try {
    cache.conn = await cache.promise;
    return cache.conn.connection.readyState === 1;
  } catch (error) {
    cache.promise = null;
    cache.conn = null;
    const message = error instanceof Error ? error.message : "Unknown database error";
    console.error(`[db] Connection failed: ${message}`);
    return false;
  }
}
