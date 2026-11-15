export const ROLES = ["admin", "manager", "viewer"] as const;
export type Role = (typeof ROLES)[number];

export const PERMISSIONS = [
  "users:read",
  "users:write",
  "projects:read",
  "projects:write",
  "audit:read",
  "reports:export",
  "settings:manage",
] as const;
export type Permission = (typeof PERMISSIONS)[number];

export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  admin: [
    "users:read",
    "users:write",
    "projects:read",
    "projects:write",
    "audit:read",
    "reports:export",
    "settings:manage",
  ],
  manager: ["users:read", "projects:read", "projects:write", "audit:read", "reports:export"],
  viewer: ["users:read", "projects:read"],
};

export function getPermissionsForRole(role: Role): Permission[] {
  return [...ROLE_PERMISSIONS[role]];
}
