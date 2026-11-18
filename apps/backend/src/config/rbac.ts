export const ROLES = ["admin", "manager", "viewer"] as const;
export type Role = (typeof ROLES)[number];

export const PERMISSIONS = [
  "users:read",
  "users:write",
  "projects:read",
  "projects:write",
  "departments:read",
  "departments:write",
  "clients:read",
  "clients:write",
  "audit:read",
  "reports:export",
] as const;
export type Permission = (typeof PERMISSIONS)[number];

export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  admin: [
    "users:read",
    "users:write",
    "projects:read",
    "projects:write",
    "departments:read",
    "departments:write",
    "clients:read",
    "clients:write",
    "audit:read",
    "reports:export",
  ],
  manager: [
    "users:read",
    "projects:read",
    "projects:write",
    "departments:read",
    "departments:write",
    "clients:read",
    "clients:write",
    "audit:read",
    "reports:export",
  ],
  viewer: ["users:read", "projects:read", "departments:read", "clients:read"],
};

export function getPermissionsForRole(role: Role): Permission[] {
  return [...ROLE_PERMISSIONS[role]];
}
