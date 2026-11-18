import type {
  AuthSessionData,
  AuthUser,
  ClientItem,
  DashboardActivityTrendData,
  DashboardEmployeeStatusData,
  DashboardStatusBreakdownData,
  DashboardSummaryData,
  DashboardTrackProgressData,
  DepartmentItem,
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
    'departments:read',
    'departments:write',
    'clients:read',
    'clients:write',
    'audit:read',
    'reports:export',
  ],
};

export const TEST_MANAGER_USER: AuthUser = {
  id: 'usr_mgr_1',
  name: 'Samira Patel',
  email: 'samira.patel@example.test',
  role: 'manager',
  permissions: [
    'users:read',
    'projects:read',
    'projects:write',
    'departments:read',
    'departments:write',
    'clients:read',
    'clients:write',
    'audit:read',
    'reports:export',
  ],
};

export const TEST_VIEWER_USER: AuthUser = {
  id: 'usr_view_1',
  name: 'Jordan Lee',
  email: 'jordan.lee@example.test',
  role: 'viewer',
  permissions: ['users:read', 'projects:read', 'departments:read', 'clients:read'],
};

export function createSessionFixture(
  user: AuthUser = TEST_ADMIN_USER,
  token = 'test-access-token',
): AuthSessionData {
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
    department: { id: 'dept_sec', name: 'Security', code: 'SEC' },
    client: { id: 'cli_1', name: 'Elena Rostova', company: 'Northstar Logistics' },
    status: 'in_progress',
    progress: 60,
    priority: 'high',
    dueDate: '2026-12-01T00:00:00.000Z',
    owner: {
      id: TEST_ADMIN_USER.id,
      name: TEST_ADMIN_USER.name,
      email: TEST_ADMIN_USER.email,
      role: 'admin',
    },
    members: [
      {
        id: TEST_MANAGER_USER.id,
        name: TEST_MANAGER_USER.name,
        email: TEST_MANAGER_USER.email,
        role: 'manager',
      },
    ],
    createdAt: '2026-11-01T10:00:00.000Z',
    updatedAt: '2026-11-10T10:00:00.000Z',
  },
  {
    id: 'prj_2',
    name: 'Query Cache Observability',
    description: 'Standardize paginated query keys and background worker CSV formatting.',
    department: { id: 'dept_be', name: 'Backend', code: 'BE' },
    client: null,
    status: 'completed',
    progress: 100,
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
  limit: 8,
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
    department: { id: 'dept_sec', name: 'Security', code: 'SEC' },
  },
  {
    id: TEST_MANAGER_USER.id,
    name: TEST_MANAGER_USER.name,
    email: TEST_MANAGER_USER.email,
    role: 'manager',
    status: 'active',
    department: { id: 'dept_be', name: 'Backend', code: 'BE' },
  },
];

export const TEST_DASHBOARD_SUMMARY: DashboardSummaryData = {
  stats: {
    totalUsers: 3,
    activeUsers: 3,
    suspendedUsers: 0,
    activeSessions: 2,
    totalDepartments: 8,
    activeDepartments: 8,
    totalClients: 3,
    activeClients: 3,
    totalProjects: 2,
    activeProjects: 1,
    inProgressProjects: 1,
    completedProjects: 1,
    upcomingProjects: 0,
    averageProgress: 80,
  },
  deadlineAlerts: [
    {
      id: 'prj_1',
      name: 'Identity Gateway Migration',
      departmentName: 'Security',
      departmentCode: 'SEC',
      status: 'in_progress',
      priority: 'high',
      progress: 60,
      dueDate: '2026-12-01T00:00:00.000Z',
      daysRemaining: 13,
      urgency: 'upcoming',
      ownerName: TEST_ADMIN_USER.name,
      teamCount: 2,
    },
  ],
  directoryPreview: TEST_TEAM_MEMBERS,
  role: 'admin',
  permissions: TEST_ADMIN_USER.permissions,
};

export const TEST_TRACK_PROGRESS: DashboardTrackProgressData = {
  averageProgress: 80,
  totalProjects: 2,
  departmentProgress: [
    { id: 'dept_fe', code: 'FE', label: 'Frontend', avgProgress: 0, projectCount: 0 },
    { id: 'dept_be', code: 'BE', label: 'Backend', avgProgress: 100, projectCount: 1 },
    { id: 'dept_sec', code: 'SEC', label: 'Security', avgProgress: 60, projectCount: 1 },
  ],
};

export const TEST_STATUS_BREAKDOWN: DashboardStatusBreakdownData = {
  totalProjects: 2,
  projectStatusBreakdown: [
    { status: 'in_progress', count: 1 },
    { status: 'completed', count: 1 },
    { status: 'upcoming', count: 0 },
  ],
};

export const TEST_ACTIVITY_TREND: DashboardActivityTrendData = {
  activityTrend: [
    { period: '2026-11-14', signIns: 4, mutations: 2 },
    { period: '2026-11-15', signIns: 6, mutations: 5 },
  ],
};

export const TEST_EMPLOYEE_STATUS: DashboardEmployeeStatusData = {
  totalEmployees: 3,
  activeEmployees: 3,
  suspendedEmployees: 0,
  statusBreakdown: [
    { status: 'active', count: 3 },
    { status: 'suspended', count: 0 },
  ],
  roleBreakdown: [
    { role: 'admin', count: 1 },
    { role: 'manager', count: 1 },
    { role: 'viewer', count: 1 },
  ],
};

export const TEST_DEPARTMENTS: DepartmentItem[] = [
  {
    id: 'dept_sec',
    name: 'Security',
    code: 'SEC',
    headName: 'Omar Tariq',
    description: 'Application security and RBAC governance.',
    status: 'active',
    employeeCount: 1,
    projectCount: 1,
    createdAt: '2026-11-01T10:00:00.000Z',
    updatedAt: '2026-11-01T10:00:00.000Z',
  },
  {
    id: 'dept_be',
    name: 'Backend',
    code: 'BE',
    headName: 'Hamza Raza',
    description: 'REST APIs and distributed services.',
    status: 'active',
    employeeCount: 1,
    projectCount: 1,
    createdAt: '2026-11-01T10:00:00.000Z',
    updatedAt: '2026-11-01T10:00:00.000Z',
  },
];

export const TEST_CLIENTS: ClientItem[] = [
  {
    id: 'cli_1',
    name: 'Elena Rostova',
    company: 'Northstar Logistics',
    email: 'elena@northstar.example',
    phone: '+1-555-0142',
    status: 'active',
    projectCount: 1,
    createdAt: '2026-11-01T10:00:00.000Z',
    updatedAt: '2026-11-01T10:00:00.000Z',
  },
  {
    id: 'cli_2',
    name: 'Marcus Vance',
    company: 'Apex FinTech Group',
    email: 'marcus@apexfintech.example',
    phone: '+1-555-0188',
    status: 'active',
    projectCount: 0,
    createdAt: '2026-11-01T10:00:00.000Z',
    updatedAt: '2026-11-01T10:00:00.000Z',
  },
];
