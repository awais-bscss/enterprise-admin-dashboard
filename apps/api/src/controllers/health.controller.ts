import type { Request, Response } from "express";
import { connectToDatabase, getDbStatus } from "../config/db.js";
import { env } from "../config/env.js";

export async function getHealth(req: Request, res: Response): Promise<void> {
  await connectToDatabase();
  const db = getDbStatus();
  let probeCookieSet = false;

  // Temporary probe cookie for testing proxy Set-Cookie forwarding; remove after check.
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
}
