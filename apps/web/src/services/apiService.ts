import { api, refreshSession } from '../lib/api';
import type { PaginationMeta } from '../types/api';
import type {
  AuditLogItem,
  AuthSessionData,
  AuthUser,
  ClientItem,
  DashboardActivityTrendData,
  DashboardEmployeeStatusData,
  DashboardOverviewData,
  DashboardStatusBreakdownData,
  DashboardSummaryData,
  DashboardTrackProgressData,
  DepartmentItem,
  DirectoryPreviewUser,
  EntityStatus,
  EntityStatusStats,
  ProjectItem,
  ProjectPriority,
  ProjectStatus,
  ProjectsWorkspaceStats,
  Role,
  UsersDirectoryStats,
} from '../types/auth';

export interface ProjectInput {
  name: string;
  description: string;
  departmentId?: string | null;
  clientId?: string | null;
  status: ProjectStatus;
  priority: ProjectPriority;
  progress: number;
  ownerId?: string;
  memberIds?: string[];
  dueDate?: string | null;
}

export interface ProjectFilters {
  q?: string;
  departmentId?: string;
  clientId?: string;
  ownerId?: string;
  status?: string;
  sort?: string;
  page?: number;
  limit?: number;
  signal?: AbortSignal;
}

export interface ProjectsListResponse {
  projects: ProjectItem[];
  stats: ProjectsWorkspaceStats;
  pagination: PaginationMeta;
}

export interface DepartmentInput {
  name: string;
  code: string;
  headName: string;
  description: string;
  status?: EntityStatus;
}

export interface ClientInput {
  name: string;
  company: string;
  email: string;
  phone: string;
  status?: EntityStatus;
}

export interface EntityFilters {
  q?: string;
  status?: string;
  page?: number;
  limit?: number;
  signal?: AbortSignal;
}

export interface DepartmentsListResponse {
  departments: DepartmentItem[];
  stats: EntityStatusStats;
  pagination: PaginationMeta;
}

export interface ClientsListResponse {
  clients: ClientItem[];
  stats: EntityStatusStats;
  pagination: PaginationMeta;
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: Role;
  status?: 'active' | 'suspended';
  departmentId?: string | null;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  role?: Role;
  status?: 'active' | 'suspended';
  password?: string;
  departmentId?: string | null;
}

export interface UsersListFilters {
  q?: string;
  role?: string;
  status?: string;
  departmentId?: string;
  page?: number;
  limit?: number;
  signal?: AbortSignal;
}

export interface UsersListResponse {
  users: DirectoryPreviewUser[];
  stats: UsersDirectoryStats;
  pagination: PaginationMeta;
}

export interface AuditLogsListResponse {
  logs: AuditLogItem[];
  pagination: PaginationMeta;
}

export const authService = {
  login: (email: string, password: string) =>
    api.post<AuthSessionData>('/auth/login', { email, password }, { skipAuth: true }),
  refresh: () => refreshSession(),
  logout: () =>
    api.post<void>('/auth/logout', undefined, { skipAuth: true, withCsrf: true }),
  updateProfile: (payload: {
    name?: string;
    currentPassword?: string;
    newPassword?: string;
  }) => api.patch<{ user: AuthUser }>('/auth/profile', payload).then((data) => data.user),
};

export const dashboardService = {
  getOverview: (signal?: AbortSignal) =>
    api.get<DashboardOverviewData>('/dashboard/overview', { signal }),
  getSummary: (signal?: AbortSignal) =>
    api.get<DashboardSummaryData>('/dashboard/summary', { signal }),
  getTrackProgress: (signal?: AbortSignal) =>
    api.get<DashboardTrackProgressData>('/dashboard/track-progress', { signal }),
  getStatusBreakdown: (signal?: AbortSignal) =>
    api.get<DashboardStatusBreakdownData>('/dashboard/status-breakdown', { signal }),
  getEmployeeStatus: (signal?: AbortSignal) =>
    api.get<DashboardEmployeeStatusData>('/dashboard/employee-status', { signal }),
  getActivityTrend: (signal?: AbortSignal) =>
    api.get<DashboardActivityTrendData>('/dashboard/activity-trend', { signal }),
};

export const projectsService = {
  list: ({ signal, ...params }: ProjectFilters = {}) =>
    api.get<ProjectsListResponse>('/projects', { params, signal }),
  create: (payload: ProjectInput) =>
    api.post<{ project: ProjectItem }>('/projects', payload).then((data) => data.project),
  update: (id: string, payload: Partial<ProjectInput>) =>
    api.patch<{ project: ProjectItem }>(`/projects/${id}`, payload).then((data) => data.project),
  remove: (id: string) =>
    api.delete<{ deletedId: string }>(`/projects/${id}`).then((data) => data.deletedId),
};

export const departmentsService = {
  list: ({ signal, ...params }: EntityFilters = {}) =>
    api.get<DepartmentsListResponse>('/departments', { params, signal }),
  create: (payload: DepartmentInput) =>
    api.post<{ department: DepartmentItem }>('/departments', payload).then((data) => data.department),
  update: (id: string, payload: Partial<DepartmentInput>) =>
    api
      .patch<{ department: DepartmentItem }>(`/departments/${id}`, payload)
      .then((data) => data.department),
  remove: (id: string) =>
    api.delete<{ deletedId: string }>(`/departments/${id}`).then((data) => data.deletedId),
};

export const clientsService = {
  list: ({ signal, ...params }: EntityFilters = {}) =>
    api.get<ClientsListResponse>('/clients', { params, signal }),
  create: (payload: ClientInput) =>
    api.post<{ client: ClientItem }>('/clients', payload).then((data) => data.client),
  update: (id: string, payload: Partial<ClientInput>) =>
    api.patch<{ client: ClientItem }>(`/clients/${id}`, payload).then((data) => data.client),
  remove: (id: string) =>
    api.delete<{ deletedId: string }>(`/clients/${id}`).then((data) => data.deletedId),
};

export const usersService = {
  list: ({ signal, ...params }: UsersListFilters = {}) =>
    api.get<UsersListResponse>('/users', { params, signal }),
  create: (payload: CreateUserInput) =>
    api.post<{ user: DirectoryPreviewUser }>('/users', payload).then((data) => data.user),
  update: (id: string, payload: UpdateUserInput) =>
    api.patch<{ user: DirectoryPreviewUser }>(`/users/${id}`, payload).then((data) => data.user),
  remove: (id: string) =>
    api.delete<{ deletedId: string }>(`/users/${id}`).then((data) => data.deletedId),
};

export const workspaceService = {
  listAuditLogs: ({
    signal,
    ...params
  }: { q?: string; resourceType?: string; page?: number; limit?: number; signal?: AbortSignal } = {}) =>
    api.get<AuditLogsListResponse>('/audit', { params, signal }),
  exportJsonReport: () =>
    api.get<Record<string, unknown>>('/reports/export', { params: { format: 'json' } }),
  exportCsvReportBlob: () =>
    api.blob('/reports/export', { params: { format: 'csv' } }),
};
