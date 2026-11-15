export type Role = 'admin' | 'manager' | 'viewer';

export type Permission =
  | 'users:read'
  | 'users:write'
  | 'audit:read'
  | 'reports:export'
  | 'settings:manage';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  permissions: Permission[];
}

export interface AuthSessionData {
  accessToken: string;
  expiresIn: number;
  user: AuthUser;
}

export interface DashboardOverviewData {
  stats: {
    totalUsers: number;
    activeUsers: number;
    activeSessions: number | null;
  };
  role: Role;
  permissions: Permission[];
}
