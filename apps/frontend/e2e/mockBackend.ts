import type { Page } from '@playwright/test';

export type MockRole = 'admin' | 'viewer';

export interface MockDepartment {
  id: string;
  name: string;
  code: string;
  headName: string;
  description: string;
  status: 'active' | 'inactive';
  employeeCount: number;
  projectCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface MockClient {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive';
  projectCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface MockProject {
  id: string;
  name: string;
  description: string;
  department: { id: string; name: string; code: string } | null;
  client: { id: string; name: string; company: string } | null;
  status: 'upcoming' | 'in_progress' | 'completed';
  progress: number;
  priority: 'low' | 'medium' | 'high';
  dueDate: string | null;
  owner: {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'manager' | 'viewer';
  };
  members: Array<{
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'manager' | 'viewer';
  }>;
  createdAt: string;
  updatedAt: string;
}

export const E2E_USERS = {
  admin: {
    id: 'e2e_admin_1',
    name: 'Alex Morgan',
    email: 'alex.morgan@example.test',
    role: 'admin' as const,
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
  },
  viewer: {
    id: 'e2e_viewer_1',
    name: 'Jordan Lee',
    email: 'jordan.lee@example.test',
    role: 'viewer' as const,
    permissions: ['users:read', 'projects:read', 'departments:read', 'clients:read'],
  },
};

export async function installMockBackend(
  page: Page,
  options: { initialRole?: MockRole | null } = {},
) {
  let activeRole: MockRole | null = options.initialRole ?? null;

  if (activeRole) {
    await page.context().addCookies([
      {
        name: 'csrf_token',
        value: `e2e-${activeRole}-csrf`,
        domain: '127.0.0.1',
        path: '/',
      },
    ]);
  }

  const departments: MockDepartment[] = [
    {
      id: 'dept_sec',
      name: 'Security',
      code: 'SEC',
      headName: 'Omar Tariq',
      description: 'Application security and RBAC governance.',
      status: 'active',
      employeeCount: 1,
      projectCount: 1,
      createdAt: '2026-11-01T09:00:00.000Z',
      updatedAt: '2026-11-01T09:00:00.000Z',
    },
    {
      id: 'dept_fe',
      name: 'Frontend',
      code: 'FE',
      headName: 'Zainab Ali',
      description: 'Web interfaces and accessibility systems.',
      status: 'active',
      employeeCount: 1,
      projectCount: 0,
      createdAt: '2026-11-01T09:00:00.000Z',
      updatedAt: '2026-11-01T09:00:00.000Z',
    },
  ];

  const clients: MockClient[] = [
    {
      id: 'cli_1',
      name: 'Elena Rostova',
      company: 'Northstar Logistics',
      email: 'elena@northstar.example',
      phone: '+1-555-0142',
      status: 'active',
      projectCount: 1,
      createdAt: '2026-11-01T09:00:00.000Z',
      updatedAt: '2026-11-01T09:00:00.000Z',
    },
  ];

  const projects: MockProject[] = [
    {
      id: 'prj_e2e_1',
      name: 'Edge CSP Enforcement',
      description: 'Harden production response headers and verify API origin routing.',
      department: { id: 'dept_sec', name: 'Security', code: 'SEC' },
      client: { id: 'cli_1', name: 'Elena Rostova', company: 'Northstar Logistics' },
      status: 'in_progress',
      progress: 70,
      priority: 'high',
      dueDate: '2026-12-10T00:00:00.000Z',
      owner: {
        id: E2E_USERS.admin.id,
        name: E2E_USERS.admin.name,
        email: E2E_USERS.admin.email,
        role: 'admin',
      },
      members: [
        {
          id: E2E_USERS.viewer.id,
          name: E2E_USERS.viewer.name,
          email: E2E_USERS.viewer.email,
          role: 'viewer',
        },
      ],
      createdAt: '2026-11-01T09:00:00.000Z',
      updatedAt: '2026-11-18T09:00:00.000Z',
    },
  ];

  const buildSummary = () => {
    const user = activeRole ? E2E_USERS[activeRole] : E2E_USERS.admin;
    const totalProjects = projects.length;
    const averageProgress =
      totalProjects > 0
        ? Math.round(projects.reduce((sum, p) => sum + p.progress, 0) / totalProjects)
        : 0;

    return {
      stats: {
        totalUsers: 2,
        activeUsers: 2,
        suspendedUsers: 0,
        activeSessions: user.permissions.includes('audit:read') ? 1 : null,
        totalDepartments: departments.length,
        activeDepartments: departments.filter((d) => d.status === 'active').length,
        totalClients: clients.length,
        activeClients: clients.filter((c) => c.status === 'active').length,
        totalProjects,
        activeProjects: projects.filter((p) => p.status !== 'completed').length,
        inProgressProjects: projects.filter((p) => p.status === 'in_progress').length,
        completedProjects: projects.filter((p) => p.status === 'completed').length,
        upcomingProjects: projects.filter((p) => p.status === 'upcoming').length,
        averageProgress,
      },
      deadlineAlerts: [
        {
          id: 'prj_e2e_1',
          name: projects[0]!.name,
          departmentName: 'Security',
          departmentCode: 'SEC',
          status: projects[0]!.status,
          priority: projects[0]!.priority,
          progress: projects[0]!.progress,
          dueDate: '2026-11-25T00:00:00.000Z',
          daysRemaining: 7,
          urgency: 'warning',
          ownerName: projects[0]!.owner.name,
          teamCount: 2,
        },
      ],
      directoryPreview: [
        {
          id: E2E_USERS.admin.id,
          name: E2E_USERS.admin.name,
          email: E2E_USERS.admin.email,
          role: 'admin',
          status: 'active',
        },
        {
          id: E2E_USERS.viewer.id,
          name: E2E_USERS.viewer.name,
          email: E2E_USERS.viewer.email,
          role: 'viewer',
          status: 'active',
        },
      ],
      role: user.role,
      permissions: user.permissions,
    };
  };

  await page.unroute('**/api/**');
  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const pathname = url.pathname;
    const method = request.method();

    if (pathname === '/api/health' && method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          service: 'enterprise-admin-api',
          db: 'connected',
          environment: 'e2e',
          timestamp: new Date().toISOString(),
        }),
      });
      return;
    }

    if (pathname === '/api/auth/login' && method === 'POST') {
      const body = request.postDataJSON() as { email?: string; password?: string };
      if (body.password === 'WrongPass1!') {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            ok: false,
            error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
          }),
        });
        return;
      }

      activeRole = body.email === E2E_USERS.viewer.email ? 'viewer' : 'admin';
      const user = E2E_USERS[activeRole];

      await page.context().addCookies([
        {
          name: 'csrf_token',
          value: `e2e-${activeRole}-csrf`,
          domain: '127.0.0.1',
          path: '/',
        },
      ]);

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          data: {
            accessToken: `e2e-${activeRole}-jwt`,
            expiresIn: 900,
            user,
          },
        }),
      });
      return;
    }

    if (pathname === '/api/auth/refresh' && method === 'POST') {
      if (!activeRole) {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            ok: false,
            error: { code: 'NO_SESSION', message: 'No active session found' },
          }),
        });
        return;
      }

      const user = E2E_USERS[activeRole];
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          data: {
            accessToken: `e2e-${activeRole}-jwt-refreshed`,
            expiresIn: 900,
            user,
          },
        }),
      });
      return;
    }

    if (pathname === '/api/auth/logout' && method === 'POST') {
      activeRole = null;
      await page.context().clearCookies();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true }),
      });
      return;
    }

    if (pathname === '/api/dashboard/summary' && method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, data: buildSummary() }),
      });
      return;
    }

    if (pathname === '/api/dashboard/overview' && method === 'GET') {
      const summary = buildSummary();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          data: {
            summary,
            trackProgress: {
              averageProgress: summary.stats.averageProgress,
              totalProjects: projects.length,
              departmentProgress: [
                {
                  id: 'dept_sec',
                  code: 'SEC',
                  label: 'Security',
                  avgProgress: summary.stats.averageProgress,
                  projectCount: projects.length,
                },
                { id: 'dept_fe', code: 'FE', label: 'Frontend', avgProgress: 0, projectCount: 0 },
              ],
            },
            statusBreakdown: {
              totalProjects: projects.length,
              projectStatusBreakdown: [
                { status: 'upcoming', count: 0 },
                { status: 'in_progress', count: projects.length },
                { status: 'completed', count: 0 },
              ],
            },
            employeeStatus: {
              totalEmployees: 2,
              activeEmployees: 2,
              suspendedEmployees: 0,
              statusBreakdown: [
                { status: 'active', count: 2 },
                { status: 'suspended', count: 0 },
              ],
              roleBreakdown: [
                { role: 'admin', count: 1 },
                { role: 'manager', count: 0 },
                { role: 'viewer', count: 1 },
              ],
            },
            activityTrend: {
              activityTrend: [
                { period: 'Thu', signIns: 2, mutations: 1 },
                { period: 'Fri', signIns: 4, mutations: 2 },
              ],
            },
          },
        }),
      });
      return;
    }

    if (pathname === '/api/departments' && method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          data: {
            departments,
            stats: { total: departments.length, active: departments.length, inactive: 0 },
            pagination: { page: 1, limit: 10, total: departments.length, totalPages: 1 },
          },
        }),
      });
      return;
    }

    if (pathname === '/api/clients' && method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          data: {
            clients,
            stats: { total: clients.length, active: clients.length, inactive: 0 },
            pagination: { page: 1, limit: 10, total: clients.length, totalPages: 1 },
          },
        }),
      });
      return;
    }

    if (pathname === '/api/users' && method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          data: {
            users: [
              {
                ...E2E_USERS.admin,
                status: 'active',
                department: { id: 'dept_sec', name: 'Security', code: 'SEC' },
                projectCount: projects.length,
              },
              {
                ...E2E_USERS.viewer,
                status: 'active',
                department: { id: 'dept_fe', name: 'Frontend', code: 'FE' },
                projectCount: 0,
              },
            ],
            stats: { total: 2, active: 2, suspended: 0, admins: 1, managers: 0, viewers: 1 },
            pagination: { page: 1, limit: 10, total: 2, totalPages: 1 },
          },
        }),
      });
      return;
    }

    if (pathname === '/api/audit' && method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          data: {
            logs: [
              {
                id: 'aud_1',
                actorName: E2E_USERS.admin.name,
                actorEmail: E2E_USERS.admin.email,
                actorRole: 'admin',
                action: 'auth.login',
                resourceType: 'auth',
                resourceId: E2E_USERS.admin.id,
                summary: 'Signed in as admin',
                createdAt: '2026-11-15T10:00:00.000Z',
              },
            ],
            pagination: { page: 1, limit: 12, total: 1, totalPages: 1 },
          },
        }),
      });
      return;
    }

    if (pathname === '/api/projects' && method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          data: {
            projects,
            stats: {
              total: projects.length,
              completed: projects.filter((p) => p.status === 'completed').length,
              inProgress: projects.filter((p) => p.status === 'in_progress').length,
              upcoming: projects.filter((p) => p.status === 'upcoming').length,
            },
            pagination: { page: 1, limit: 8, total: projects.length, totalPages: 1 },
          },
        }),
      });
      return;
    }

    if (pathname === '/api/projects' && method === 'POST') {
      const payload = request.postDataJSON() as {
        name: string;
        description: string;
        departmentId?: string | null;
        clientId?: string | null;
        status: MockProject['status'];
        priority: MockProject['priority'];
        progress: number;
      };
      const dept = departments.find((d) => d.id === payload.departmentId) ?? departments[0]!;
      const client = clients.find((c) => c.id === payload.clientId) ?? null;

      const created: MockProject = {
        ...projects[0]!,
        id: `prj_e2e_${projects.length + 1}`,
        name: payload.name,
        description: payload.description,
        department: { id: dept.id, name: dept.name, code: dept.code },
        client: client ? { id: client.id, name: client.name, company: client.company } : null,
        status: payload.status,
        priority: payload.priority,
        progress: payload.progress ?? 0,
      };
      projects.unshift(created);
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, data: { project: created } }),
      });
      return;
    }

    await route.fulfill({
      status: 404,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: false,
        error: { code: 'NOT_FOUND', message: 'Unhandled mock route' },
      }),
    });
  });
}
