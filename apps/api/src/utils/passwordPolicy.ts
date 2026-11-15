import { type Role } from "../config/rbac.js";
import { WorkspaceSetting } from "../models/WorkspaceSetting.js";

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
  const policy = await WorkspaceSetting.findOne({ key: "default" })
    .select("enforceStrongPasswords defaultNewUserRole")
    .lean();

  return {
    enforceStrongPasswords: policy?.enforceStrongPasswords ?? true,
    defaultNewUserRole: (policy?.defaultNewUserRole ?? "viewer") as Role,
  };
}

export async function validateWorkspacePassword(
  password: string,
  enforceOverride?: boolean,
): Promise<string | null> {
  const enforceStrong =
    enforceOverride ?? (await getWorkspaceSecurityDefaults()).enforceStrongPasswords;

  if (enforceStrong && !isStrongPassword(password)) {
    return STRONG_PASSWORD_ERROR;
  }
  return null;
}
