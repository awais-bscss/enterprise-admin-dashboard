import { type Role } from "../config/rbac.js";

export const STRONG_PASSWORD_ERROR =
  "Password must be 8+ characters with uppercase, lowercase, and a number";

export function isStrongPassword(password: string): boolean {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password)
  );
}

export interface WorkspaceSecurityDefaults {
  enforceStrongPasswords: boolean;
  defaultNewUserRole: Role;
}

export async function getWorkspaceSecurityDefaults(): Promise<WorkspaceSecurityDefaults> {
  return {
    enforceStrongPasswords: true,
    defaultNewUserRole: "viewer",
  };
}

export async function validateWorkspacePassword(
  password: string,
  enforceOverride = true,
): Promise<string | null> {
  if (enforceOverride && !isStrongPassword(password)) {
    return STRONG_PASSWORD_ERROR;
  }
  return null;
}
