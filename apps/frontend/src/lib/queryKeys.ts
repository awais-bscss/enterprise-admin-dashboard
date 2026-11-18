import type { QueryClient, QueryKey } from '@tanstack/react-query';

export interface ProjectListQueryParams {
  q: string;
  departmentId: string;
  clientId?: string;
  ownerId: string;
  status: string;
  sort?: string;
  page: number;
  limit: number;
}

export interface EntityListQueryParams {
  q: string;
  status: string;
  page: number;
  limit: number;
}

export interface UserListQueryParams {
  q: string;
  role: string;
  status: string;
  departmentId: string;
  page: number;
  limit: number;
}

export interface AuditListQueryParams {
  q: string;
  resourceType: string;
  page: number;
  limit: number;
}

export const queryKeys = {
  dashboard: {
    all: ['dashboard'] as const,
    overview: ['dashboard', 'overview'] as const,
    summary: ['dashboard', 'summary'] as const,
    trackProgress: ['dashboard', 'track-progress'] as const,
    statusBreakdown: ['dashboard', 'status-breakdown'] as const,
    employeeStatus: ['dashboard', 'employee-status'] as const,
    activityTrend: ['dashboard', 'activity-trend'] as const,
  },
  projects: {
    all: ['projects'] as const,
    list: (params: ProjectListQueryParams) => ['projects', 'list', params] as const,
  },
  departments: {
    all: ['departments'] as const,
    list: (params: EntityListQueryParams) => ['departments', 'list', params] as const,
  },
  clients: {
    all: ['clients'] as const,
    list: (params: EntityListQueryParams) => ['clients', 'list', params] as const,
  },
  users: {
    all: ['users'] as const,
    list: (params: UserListQueryParams) => ['users', 'list', params] as const,
  },
  audit: {
    all: ['audit'] as const,
    list: (params: AuditListQueryParams) => ['audit', 'list', params] as const,
  },
};

export type WorkspaceQueryScope =
  | 'projects'
  | 'departments'
  | 'clients'
  | 'users'
  | 'dashboard'
  | 'audit';

const SCOPE_KEY_MAP: Record<WorkspaceQueryScope, QueryKey> = {
  projects: queryKeys.projects.all,
  departments: queryKeys.departments.all,
  clients: queryKeys.clients.all,
  users: queryKeys.users.all,
  dashboard: queryKeys.dashboard.all,
  audit: queryKeys.audit.all,
};

export function invalidateWorkspaceQueries(
  client: QueryClient,
  scopes: readonly WorkspaceQueryScope[],
): Promise<void[]> {
  return Promise.all(
    scopes.map((scope) => client.invalidateQueries({ queryKey: SCOPE_KEY_MAP[scope] })),
  );
}
