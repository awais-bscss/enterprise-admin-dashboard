import { api, refreshSession } from '../lib/api';
import type { PaginationMeta } from '../types/api';
import type {
  AuditLogItem,
  AuthSessionData,
  AuthUser,
  DashboardOverviewData,
  DirectoryPreviewUser,
  ProjectCategory,
  ProjectItem,
  ProjectPriority,
  ProjectStatus,
  ProjectsWorkspaceStats,
  Role,
  UsersDirectoryStats,
  WorkspaceSettingsData,
} from '../types/auth';

export interface ProjectInput {
  name: string;
  description: string;
  category: ProjectCategory;
  status: ProjectStatus;
  priority: ProjectPriority;
  tasksTotal: number;
  tasksCompleted: number;
  ownerId?: string;
  dueDate?: string | null;
}

export interface ProjectFilters {
  q?: string;
  category?: string;
  status?: string;
  page?: number;
  limit?: number;
  signal?: AbortSignal;
}

export interface ProjectsListResponse {
  projects: ProjectItem[];
  stats: ProjectsWorkspaceStats;
  pagination: PaginationMeta;
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: Role;
  status?: 'active' | 'suspended';
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  role?: Role;
  status?: 'active' | 'suspended';
  password?: string;
}

export interface UsersListFilters {
  q?: string;
  role?: string;
  status?: string;
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
};

export const projectsService = {
  list: ({ signal, ...params }: ProjectFilters = {}) =>
    api.get<ProjectsListResponse>('/projects', { params, signal }),
  create: (payload: ProjectInput) =>
    api.post<{ project: ProjectItem }>('/projects', payload).then((data) => data.project),
  importBatch: (projects: ProjectInput[]) =>
    api.post<{ importedCount: number; projects: ProjectItem[] }>('/projects/import', { projects }),
  update: (id: string, payload: Partial<ProjectInput>) =>
    api.patch<{ project: ProjectItem }>(`/projects/${id}`, payload).then((data) => data.project),
  remove: (id: string) =>
    api.delete<{ deletedId: string }>(`/projects/${id}`).then((data) => data.deletedId),
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
  }: { resourceType?: string; page?: number; limit?: number; signal?: AbortSignal } = {}) =>
    api.get<AuditLogsListResponse>('/audit', { params, signal }),
  getSettings: (signal?: AbortSignal) =>
    api.get<{ settings: WorkspaceSettingsData }>('/settings', { signal }).then((data) => data.settings),
  updateSettings: (
    payload: Partial<Omit<WorkspaceSettingsData, 'updatedByName' | 'updatedAt'>>,
  ) =>
    api
      .patch<{ settings: WorkspaceSettingsData }>('/settings', payload)
      .then((data) => data.settings),
  exportJsonReport: () =>
    api.get<Record<string, unknown>>('/reports/export', { params: { format: 'json' } }),
  exportCsvReportBlob: () =>
    api.blob('/reports/export', { params: { format: 'csv' } }),
};
