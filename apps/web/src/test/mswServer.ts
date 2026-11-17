import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import {
  TEST_ADMIN_USER,
  TEST_DASHBOARD_OVERVIEW,
  TEST_PAGINATION,
  TEST_PROJECT_STATS,
  TEST_PROJECTS,
  TEST_TEAM_MEMBERS,
  createSessionFixture,
} from './fixtures';

export const defaultHandlers = [
  http.post('*/api/auth/login', () =>
    HttpResponse.json({
      ok: true,
      data: createSessionFixture(TEST_ADMIN_USER),
    }),
  ),
  http.post('*/api/auth/refresh', () =>
    HttpResponse.json({
      ok: true,
      data: createSessionFixture(TEST_ADMIN_USER),
    }),
  ),
  http.post('*/api/auth/logout', () => HttpResponse.json({ ok: true })),
  http.get('*/api/dashboard/overview', () =>
    HttpResponse.json({
      ok: true,
      data: TEST_DASHBOARD_OVERVIEW,
    }),
  ),
  http.get('*/api/projects', () =>
    HttpResponse.json({
      ok: true,
      data: {
        projects: TEST_PROJECTS,
        stats: TEST_PROJECT_STATS,
        pagination: TEST_PAGINATION,
      },
    }),
  ),
  http.get('*/api/users', () =>
    HttpResponse.json({
      ok: true,
      data: {
        users: TEST_TEAM_MEMBERS,
        stats: { total: 2, active: 2, suspended: 0, admins: 1, managers: 1, viewers: 0 },
        pagination: TEST_PAGINATION,
      },
    }),
  ),
];

export const server = setupServer(...defaultHandlers);
