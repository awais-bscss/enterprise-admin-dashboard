export type Role = 'admin' | 'manager' | 'viewer';

export type Permission =
  | 'users:read'
  | 'users:write'
  | 'projects:read'
  | 'projects:write'
  | 'audit:read'
  | 'reports:export'
  | 'settings:manage';

export type ProjectCategory = 'development' | 'design' | 'testing' | 'security';
export type ProjectStatus = 'upcoming' | 'in_progress' | 'completed';
export type ProjectPriority = 'low' | 'medium' | 'high';

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

export interface ProjectOwnerSummary {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface ProjectItem {
  id: string;
  name: string;
  description: string;
  category: ProjectCategory;
  status: ProjectStatus;
  progress: number;
  tasksTotal: number;
  tasksCompleted: number;
  priority: ProjectPriority;
  dueDate: string | null;
  owner: ProjectOwnerSummary;
  createdAt: string;
  updatedAt: string;
}

export interface RoleBreakdownItem {
  role: Role;
  count: number;
}

export interface ProjectStatusBreakdownItem {
  status: ProjectStatus;
  count: number;
}

export interface CategoryProgressItem {
  category: ProjectCategory;
  label: string;
  avgProgress: number;
  projectCount: number;
  tasksTotal: number;
}

export interface ActivityTrendPoint {
  period: string;
  signIns: number;
  mutations: number;
}

export interface RecentProjectSummary {
  id: string;
  name: string;
  category: ProjectCategory;
  status: ProjectStatus;
  priority: ProjectPriority;
  progress: number;
  tasksTotal: number;
  tasksCompleted: number;
  ownerName: string;
}

export interface DirectoryPreviewUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: 'active' | 'suspended';
  projectCount?: number;
  createdAt?: string;
}

export interface UsersDirectoryStats {
  total: number;
  active: number;
  suspended: number;
  admins: number;
  managers: number;
  viewers: number;
}

export interface AuditLogItem {
  id: string;
  actorName: string;
  actorEmail: string;
  actorRole: string;
  action: string;
  resourceType: 'auth' | 'project' | 'user' | 'settings' | 'report';
  resourceId: string | null;
  summary: string;
  createdAt: string;
}

export interface WorkspaceSettingsData {
  organizationName: string;
  defaultNewUserRole: 'manager' | 'viewer';
  sessionTimeoutMinutes: number;
  enforceStrongPasswords: boolean;
  auditRetentionDays: number;
  updatedByName: string;
  updatedAt: string;
}

export interface DashboardOverviewData {
  stats: {
    totalUsers: number;
    activeUsers: number;
    suspendedUsers: number;
    activeSessions: number | null;
    totalProjects: number;
    activeProjects: number;
    inProgressProjects: number;
    completedProjects: number;
    upcomingProjects: number;
    totalTasks: number;
    completedTasks: number;
    averageProgress: number;
  };
  roleBreakdown: RoleBreakdownItem[];
  projectStatusBreakdown: ProjectStatusBreakdownItem[];
  categoryProgress: CategoryProgressItem[];
  activityTrend: ActivityTrendPoint[];
  recentProjects: RecentProjectSummary[];
  directoryPreview: DirectoryPreviewUser[];
  role: Role;
  permissions: Permission[];
}
