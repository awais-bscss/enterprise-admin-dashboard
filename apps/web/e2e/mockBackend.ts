import type { Page } from '@playwright/test';

export type MockRole = 'admin' | 'viewer';

export interface MockProject {
  id: string;
  name: string;
  description: string;
  category: 'development' | 'design' | 'testing' | 'security';
  status: 'upcoming' | 'in_progress' | 'completed';
  progress: number;
  tasksTotal: number;
  tasksCompleted: number;
  priority: 'low' | 'medium' | 'high';
  dueDate: string | null;
  owner: {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'manager' | 'viewer';
  };
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
      'audit:read',
      'reports:export',
      'settings:manage',
    ],
  },
  viewer: {
    id: 'e2e_viewer_1',
    name: 'Jordan Lee',
    email: 'jordan.lee@example.test',
    role: 'viewer' as const,
    permissions: ['users:read', 'projects:read'],
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

  const projects: MockProject[] = [
    {
      id: 'prj_e2e_1',
      name: 'Edge CSP Enforcement',
      description: 'Harden production response headers and verify API origin routing.',
      category: 'security',
      status: 'in_progress',
      progress: 70,
      tasksTotal: 10,
      tasksCompleted: 7,
      priority: 'high',
      dueDate: '2026-12-10T00:00:00.000Z',
      owner: {
        id: E2E_USERS.admin.id,
        name: E2E_USERS.admin.name,
        email: E2E_USERS.admin.email,
        role: 'admin',
      },
      createdAt: '2026-11-01T09:00:00.000Z',
      updatedAt: '2026-11-10T09:00:00.000Z',
    },
  ];

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

    if (pathname === '/api/health' && method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, db: 'connected' }),
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

    if (pathname === '/api/settings' && method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          data: {
            settings: {
              organizationName: 'PMS Enterprise',
              defaultNewUserRole: 'viewer',
              sessionTimeoutMinutes: 15,
              enforceStrongPasswords: true,
              auditRetentionDays: 90,
              updatedByName: E2E_USERS.admin.name,
              updatedAt: '2026-11-15T10:00:00.000Z',
            },
          },
        }),
      });
      return;
    }

    if (pathname === '/api/dashboard/overview' && method === 'GET') {
      const user = activeRole ? E2E_USERS[activeRole] : E2E_USERS.admin;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          data: {
            stats: {
              totalUsers: 2,
              activeUsers: 2,
              suspendedUsers: 0,
              activeSessions: 1,
              totalProjects: projects.length,
              activeProjects: projects.filter((p) => p.status !== 'completed').length,
              inProgressProjects: projects.filter((p) => p.status === 'in_progress').length,
              completedProjects: projects.filter((p) => p.status === 'completed').length,
              upcomingProjects: projects.filter((p) => p.status === 'upcoming').length,
              totalTasks: projects.reduce((sum, p) => sum + p.tasksTotal, 0),
              completedTasks: projects.reduce((sum, p) => sum + p.tasksCompleted, 0),
              averageProgress: 70,
            },
            roleBreakdown: [
              { role: 'admin', count: 1 },
              { role: 'viewer', count: 1 },
            ],
            projectStatusBreakdown: [{ status: 'in_progress', count: projects.length }],
            categoryProgress: [
              {
                category: 'security',
                label: 'Security',
                avgProgress: 70,
                projectCount: projects.length,
                tasksTotal: 10,
              },
            ],
            activityTrend: [{ period: '2026-11-15', signIns: 4, mutations: 2 }],
            recentProjects: projects.map((p) => ({
              id: p.id,
              name: p.name,
              category: p.category,
              status: p.status,
              priority: p.priority,
              progress: p.progress,
              tasksTotal: p.tasksTotal,
              tasksCompleted: p.tasksCompleted,
              ownerName: p.owner.name,
            })),
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
              { ...E2E_USERS.admin, status: 'active' },
              { ...E2E_USERS.viewer, status: 'active' },
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
            pagination: { page: 1, limit: 6, total: projects.length, totalPages: 1 },
          },
        }),
      });
      return;
    }

    if (pathname === '/api/projects' && method === 'POST') {
      const payload = request.postDataJSON() as {
        name: string;
        description: string;
        category: MockProject['category'];
        status: MockProject['status'];
        priority: MockProject['priority'];
        tasksTotal: number;
        tasksCompleted: number;
      };
      const created: MockProject = {
        ...projects[0],
        id: `prj_e2e_${projects.length + 1}`,
        name: payload.name,
        description: payload.description,
        category: payload.category,
        status: payload.status,
        priority: payload.priority,
        tasksTotal: payload.tasksTotal,
        tasksCompleted: payload.tasksCompleted,
        progress: Math.round((payload.tasksCompleted / payload.tasksTotal) * 100),
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
      body: JSON.stringify({ ok: false, error: { code: 'NOT_FOUND', message: 'Unhandled mock route' } }),
    });
  });
}
