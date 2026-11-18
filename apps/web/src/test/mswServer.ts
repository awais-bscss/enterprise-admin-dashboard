import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import {
  TEST_ACTIVITY_TREND,
  TEST_ADMIN_USER,
  TEST_DASHBOARD_SUMMARY,
  TEST_EMPLOYEE_STATUS,
  TEST_PAGINATION,
  TEST_PROJECT_STATS,
  TEST_PROJECTS,
  TEST_STATUS_BREAKDOWN,
  TEST_TEAM_MEMBERS,
  TEST_TRACK_PROGRESS,
  createSessionFixture,
} from './fixtures';

export const defaultHandlers = [
  http.get('*/api/health', () => HttpResponse.json({ ok: true, db: 'connected' })),
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
  http.get('*/api/dashboard/summary', () =>
    HttpResponse.json({ ok: true, data: TEST_DASHBOARD_SUMMARY }),
  ),
  http.get('*/api/dashboard/track-progress', () =>
    HttpResponse.json({ ok: true, data: TEST_TRACK_PROGRESS }),
  ),
  http.get('*/api/dashboard/status-breakdown', () =>
    HttpResponse.json({ ok: true, data: TEST_STATUS_BREAKDOWN }),
  ),
  http.get('*/api/dashboard/employee-status', () =>
    HttpResponse.json({ ok: true, data: TEST_EMPLOYEE_STATUS }),
  ),
  http.get('*/api/dashboard/activity-trend', () =>
    HttpResponse.json({ ok: true, data: TEST_ACTIVITY_TREND }),
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
