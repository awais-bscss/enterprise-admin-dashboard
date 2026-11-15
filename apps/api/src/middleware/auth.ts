import type { NextFunction, Request, Response } from "express";
import { getPermissionsForRole, type Permission, type Role } from "../config/rbac.js";
import { User } from "../models/User.js";
import { verifyAccessToken } from "../utils/tokens.js";

export interface AuthContext {
  userId: string;
  name: string;
  email: string;
  role: Role;
  permissions: Permission[];
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthContext;
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const header = req.get("authorization");
  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({
      ok: false,
      error: { code: "UNAUTHORIZED", message: "Authentication required" },
    });
    return;
  }

  const token = header.slice("Bearer ".length).trim();
  if (!token) {
    res.status(401).json({
      ok: false,
      error: { code: "UNAUTHORIZED", message: "Authentication required" },
    });
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.sub).select("name email role status").lean();

    if (!user || user.status !== "active") {
      res.status(401).json({
        ok: false,
        error: { code: "UNAUTHORIZED", message: "Account is inactive or missing" },
      });
      return;
    }

    const role = user.role as Role;
    req.auth = {
      userId: String(user._id),
      name: user.name,
      email: user.email,
      role,
      permissions: getPermissionsForRole(role),
    };

    next();
  } catch {
    res.status(401).json({
      ok: false,
      error: { code: "TOKEN_EXPIRED", message: "Access token is invalid or expired" },
    });
  }
}

export function requirePermission(permission: Permission) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.auth) {
      res.status(401).json({
        ok: false,
        error: { code: "UNAUTHORIZED", message: "Authentication required" },
      });
      return;
    }

    if (!req.auth.permissions.includes(permission)) {
      res.status(403).json({
        ok: false,
        error: { code: "FORBIDDEN", message: "Insufficient permissions" },
      });
      return;
    }

    next();
  };
}
