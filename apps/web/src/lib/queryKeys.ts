import type { QueryClient, QueryKey } from '@tanstack/react-query';

export interface ProjectListQueryParams {
  q: string;
  category: string;
  status: string;
  page: number;
  limit: number;
}

export interface UserListQueryParams {
  q: string;
  role: string;
  status: string;
  page: number;
  limit: number;
}

export interface AuditListQueryParams {
  resourceType: string;
  page: number;
  limit: number;
}

export const queryKeys = {
  dashboard: ['dashboard', 'overview'] as const,
  settings: ['settings'] as const,
  projects: {
    all: ['projects'] as const,
    list: (params: ProjectListQueryParams) => ['projects', 'list', params] as const,
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

export type WorkspaceQueryScope = 'projects' | 'users' | 'dashboard' | 'audit' | 'settings';

const SCOPE_KEY_MAP: Record<WorkspaceQueryScope, QueryKey> = {
  projects: queryKeys.projects.all,
  users: queryKeys.users.all,
  dashboard: queryKeys.dashboard,
  audit: queryKeys.audit.all,
  settings: queryKeys.settings,
};

export function invalidateWorkspaceQueries(
  client: QueryClient,
  scopes: readonly WorkspaceQueryScope[],
): Promise<void[]> {
  return Promise.all(
    scopes.map((scope) => client.invalidateQueries({ queryKey: SCOPE_KEY_MAP[scope] })),
  );
}
