export type Role = 'admin' | 'manager' | 'viewer';

export type Permission =
  | 'users:read'
  | 'users:write'
  | 'projects:read'
  | 'projects:write'
  | 'departments:read'
  | 'departments:write'
  | 'clients:read'
  | 'clients:write'
  | 'audit:read'
  | 'reports:export';

export type ProjectStatus = 'upcoming' | 'in_progress' | 'completed';
export type ProjectPriority = 'low' | 'medium' | 'high';
export type EntityStatus = 'active' | 'inactive';

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

export interface DepartmentRef {
  id: string;
  name: string;
  code: string;
}

export interface ClientRef {
  id: string;
  name: string;
  company: string;
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
  department: DepartmentRef | null;
  client: ClientRef | null;
  status: ProjectStatus;
  progress: number;
  priority: ProjectPriority;
  dueDate: string | null;
  owner: ProjectOwnerSummary;
  members?: ProjectOwnerSummary[];
  createdAt: string;
  updatedAt: string;
}

export interface DepartmentItem {
  id: string;
  name: string;
  code: string;
  headName: string;
  description: string;
  status: EntityStatus;
  employeeCount?: number;
  projectCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ClientItem {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  status: EntityStatus;
  projectCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface EntityStatusStats {
  total: number;
  active: number;
  inactive: number;
}

export interface ProjectStatusBreakdownItem {
  status: ProjectStatus;
  count: number;
}

export interface DepartmentProgressItem {
  id: string;
  code: string;
  label: string;
  avgProgress: number;
  projectCount: number;
}

export interface ActivityTrendPoint {
  period: string;
  signIns: number;
  mutations: number;
}

export type DeadlineUrgency = 'critical' | 'warning' | 'upcoming';

export interface DeadlineAlertItem {
  id: string;
  name: string;
  departmentName: string;
  departmentCode: string | null;
  status: ProjectStatus;
  priority: ProjectPriority;
  progress: number;
  dueDate: string;
  daysRemaining: number;
  urgency: DeadlineUrgency;
  ownerName: string;
  teamCount?: number;
}

export interface DirectoryPreviewUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: 'active' | 'suspended';
  department?: DepartmentRef | null;
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

export interface ProjectsWorkspaceStats {
  total: number;
  completed: number;
  inProgress: number;
  upcoming: number;
}

export interface AuditLogItem {
  id: string;
  actorName: string;
  actorEmail: string;
  actorRole: string;
  action: string;
  resourceType: 'auth' | 'project' | 'department' | 'client' | 'user' | 'report';
  resourceId: string | null;
  summary: string;
  createdAt: string;
}

export interface DashboardSummaryData {
  stats: {
    totalUsers: number;
    activeUsers: number;
    suspendedUsers: number;
    activeSessions: number | null;
    totalDepartments: number;
    activeDepartments: number;
    totalClients: number;
    activeClients: number;
    totalProjects: number;
    activeProjects: number;
    inProgressProjects: number;
    completedProjects: number;
    upcomingProjects: number;
    averageProgress: number;
  };
  deadlineAlerts: DeadlineAlertItem[];
  directoryPreview: DirectoryPreviewUser[];
  role: Role;
  permissions: Permission[];
}

export interface DashboardTrackProgressData {
  averageProgress: number;
  totalProjects: number;
  departmentProgress: DepartmentProgressItem[];
}

export interface DashboardStatusBreakdownData {
  totalProjects: number;
  projectStatusBreakdown: ProjectStatusBreakdownItem[];
}

export interface DashboardActivityTrendData {
  activityTrend: ActivityTrendPoint[];
}

export interface EmployeeStatusBreakdownItem {
  status: 'active' | 'suspended';
  count: number;
}

export interface EmployeeRoleBreakdownItem {
  role: Role;
  count: number;
}

export interface DashboardEmployeeStatusData {
  totalEmployees: number;
  activeEmployees: number;
  suspendedEmployees: number;
  statusBreakdown: EmployeeStatusBreakdownItem[];
  roleBreakdown: EmployeeRoleBreakdownItem[];
}

export interface DashboardOverviewData {
  summary: DashboardSummaryData;
  trackProgress: DashboardTrackProgressData;
  statusBreakdown: DashboardStatusBreakdownData;
  employeeStatus: DashboardEmployeeStatusData;
  activityTrend: DashboardActivityTrendData;
}
