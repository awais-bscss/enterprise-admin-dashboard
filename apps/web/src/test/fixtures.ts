import type {
  AuthSessionData,
  AuthUser,
  DashboardOverviewData,
  DirectoryPreviewUser,
  ProjectItem,
  ProjectsWorkspaceStats,
} from '../types/auth';
import type { PaginationMeta } from '../types/api';

export const TEST_ADMIN_USER: AuthUser = {
  id: 'usr_admin_1',
  name: 'Alex Morgan',
  email: 'alex.morgan@example.test',
  role: 'admin',
  permissions: [
    'users:read',
    'users:write',
    'projects:read',
    'projects:write',
    'audit:read',
    'reports:export',
    'settings:manage',
  ],
};

export const TEST_MANAGER_USER: AuthUser = {
  id: 'usr_mgr_1',
  name: 'Samira Patel',
  email: 'samira.patel@example.test',
  role: 'manager',
  permissions: ['users:read', 'projects:read', 'projects:write', 'audit:read', 'reports:export'],
};

export const TEST_VIEWER_USER: AuthUser = {
  id: 'usr_view_1',
  name: 'Jordan Lee',
  email: 'jordan.lee@example.test',
  role: 'viewer',
  permissions: ['users:read', 'projects:read'],
};

export function createSessionFixture(user: AuthUser = TEST_ADMIN_USER, token = 'test-access-token'): AuthSessionData {
  return {
    accessToken: token,
    expiresIn: 900,
    user,
  };
}

export const TEST_PROJECTS: ProjectItem[] = [
  {
    id: 'prj_1',
    name: 'Identity Gateway Migration',
    description: 'Migrate token rotation and strict CSP policies across gateway edge routes.',
    category: 'security',
    status: 'in_progress',
    progress: 60,
    tasksTotal: 10,
    tasksCompleted: 6,
    priority: 'high',
    dueDate: '2026-12-01T00:00:00.000Z',
    owner: {
      id: TEST_ADMIN_USER.id,
      name: TEST_ADMIN_USER.name,
      email: TEST_ADMIN_USER.email,
      role: 'admin',
    },
    createdAt: '2026-11-01T10:00:00.000Z',
    updatedAt: '2026-11-10T10:00:00.000Z',
  },
  {
    id: 'prj_2',
    name: 'Query Cache Observability',
    description: 'Standardize paginated query keys and background worker CSV formatting.',
    category: 'development',
    status: 'completed',
    progress: 100,
    tasksTotal: 8,
    tasksCompleted: 8,
    priority: 'medium',
    dueDate: null,
    owner: {
      id: TEST_MANAGER_USER.id,
      name: TEST_MANAGER_USER.name,
      email: TEST_MANAGER_USER.email,
      role: 'manager',
    },
    createdAt: '2026-11-02T10:00:00.000Z',
    updatedAt: '2026-11-11T10:00:00.000Z',
  },
];

export const TEST_PROJECT_STATS: ProjectsWorkspaceStats = {
  total: 2,
  completed: 1,
  inProgress: 1,
  upcoming: 0,
};

export const TEST_PAGINATION: PaginationMeta = {
  page: 1,
  limit: 6,
  total: 2,
  totalPages: 1,
};

export const TEST_TEAM_MEMBERS: DirectoryPreviewUser[] = [
  {
    id: TEST_ADMIN_USER.id,
    name: TEST_ADMIN_USER.name,
    email: TEST_ADMIN_USER.email,
    role: 'admin',
    status: 'active',
  },
  {
    id: TEST_MANAGER_USER.id,
    name: TEST_MANAGER_USER.name,
    email: TEST_MANAGER_USER.email,
    role: 'manager',
    status: 'active',
  },
];

export const TEST_DASHBOARD_OVERVIEW: DashboardOverviewData = {
  stats: {
    totalUsers: 3,
    activeUsers: 3,
    suspendedUsers: 0,
    activeSessions: 2,
    totalProjects: 2,
    activeProjects: 1,
    inProgressProjects: 1,
    completedProjects: 1,
    upcomingProjects: 0,
    totalTasks: 18,
    completedTasks: 14,
    averageProgress: 80,
  },
  roleBreakdown: [
    { role: 'admin', count: 1 },
    { role: 'manager', count: 1 },
    { role: 'viewer', count: 1 },
  ],
  projectStatusBreakdown: [
    { status: 'in_progress', count: 1 },
    { status: 'completed', count: 1 },
    { status: 'upcoming', count: 0 },
  ],
  categoryProgress: [
    { category: 'security', label: 'Security', avgProgress: 60, projectCount: 1, tasksTotal: 10 },
    { category: 'development', label: 'Development', avgProgress: 100, projectCount: 1, tasksTotal: 8 },
  ],
  activityTrend: [
    { period: '2026-11-14', signIns: 4, mutations: 2 },
    { period: '2026-11-15', signIns: 6, mutations: 5 },
  ],
  recentProjects: [
    {
      id: 'prj_1',
      name: 'Identity Gateway Migration',
      category: 'security',
      status: 'in_progress',
      priority: 'high',
      progress: 60,
      tasksTotal: 10,
      tasksCompleted: 6,
      ownerName: TEST_ADMIN_USER.name,
    },
  ],
  directoryPreview: TEST_TEAM_MEMBERS,
  role: 'admin',
  permissions: TEST_ADMIN_USER.permissions,
};
