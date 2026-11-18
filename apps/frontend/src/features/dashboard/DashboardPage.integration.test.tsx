import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { loadDashboardChartsGrid } from '../../app/routePreload';
import {
  TEST_ACTIVITY_TREND,
  TEST_DASHBOARD_SUMMARY,
  TEST_EMPLOYEE_STATUS,
  TEST_STATUS_BREAKDOWN,
  TEST_TRACK_PROGRESS,
  TEST_VIEWER_USER,
  createSessionFixture,
} from '../../test/fixtures';
import { server } from '../../test/mswServer';
import { renderWithProviders } from '../../test/renderWithProviders';
import { ProtectedRoute } from '../auth/ProtectedRoute';
import { DashboardPage } from './DashboardPage';

function renderDashboardRoute() {
  return renderWithProviders(
    <Routes>
      <Route path="/login" element={<div>Login View</div>} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
    </Routes>,
    { initialEntries: ['/dashboard'] },
  );
}

describe('DashboardPage integration', () => {
  beforeEach(() => {
    vi.mocked(loadDashboardChartsGrid).mockImplementation(() =>
      import('./components/DashboardChartsGrid').then((mod) => ({
        default: mod.DashboardChartsGrid,
      })),
    );
  });

  it('renders KPI cards, deadline alerts, and native SVG charts from combined overview API', async () => {
    const user = userEvent.setup();
    document.cookie = 'csrf_token=admin-csrf.sig; path=/';

    renderDashboardRoute();

    expect(
      await screen.findByRole(
        'heading',
        { name: 'Project & Administration Overview' },
        { timeout: 4000 },
      ),
    ).toBeInTheDocument();

    expect(
      await screen.findByRole('region', { name: 'Deadline alerts' }, { timeout: 4000 }),
    ).toBeInTheDocument();
    expect(screen.getByText('Identity Gateway Migration')).toBeInTheDocument();
    expect(screen.getByText('1 due within 14d')).toBeInTheDocument();

    expect(
      await screen.findByRole('heading', { name: 'Department Progress' }, { timeout: 4000 }),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Project Status' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Employee Status' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Activity Trend' })).toBeInTheDocument();

    expect(screen.getByRole('img', { name: /average progress by department/i })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /project status:/i })).toBeInTheDocument();

    const percentButtons = screen.getAllByRole('button', { name: 'Show percentages' });
    await user.click(percentButtons[0]!);
    expect(screen.getAllByText('50%').length).toBeGreaterThanOrEqual(2);
  });

  it('shows On track banner when no active projects have upcoming deadlines', async () => {
    document.cookie = 'csrf_token=admin-csrf.sig; path=/';

    server.use(
      http.get('*/api/dashboard/overview', () =>
        HttpResponse.json({
          ok: true,
          data: {
            summary: { ...TEST_DASHBOARD_SUMMARY, deadlineAlerts: [] },
            trackProgress: TEST_TRACK_PROGRESS,
            statusBreakdown: TEST_STATUS_BREAKDOWN,
            employeeStatus: TEST_EMPLOYEE_STATUS,
            activityTrend: TEST_ACTIVITY_TREND,
          },
        }),
      ),
    );

    renderDashboardRoute();

    expect(await screen.findByText('On track')).toBeInTheDocument();
    expect(
      screen.getByText(
        'All active projects are on schedule — no upcoming deadlines in the next 14 days.',
      ),
    ).toBeInTheDocument();
  });

  it('shows ErrorAlertBanner when overview fails and recovers cleanly on Retry', async () => {
    const user = userEvent.setup();
    document.cookie = 'csrf_token=admin-csrf.sig; path=/';
    let shouldFail = true;

    server.use(
      http.get('*/api/dashboard/overview', () => {
        if (shouldFail) {
          return HttpResponse.json(
            { ok: false, error: { code: 'OVERVIEW_FAIL', message: 'Overview temporarily unavailable' } },
            { status: 400 },
          );
        }
        return HttpResponse.json({
          ok: true,
          data: {
            summary: TEST_DASHBOARD_SUMMARY,
            trackProgress: TEST_TRACK_PROGRESS,
            statusBreakdown: TEST_STATUS_BREAKDOWN,
            employeeStatus: TEST_EMPLOYEE_STATUS,
            activityTrend: TEST_ACTIVITY_TREND,
          },
        });
      }),
    );

    renderDashboardRoute();

    const alerts = await screen.findAllByRole('alert', undefined, { timeout: 4000 });
    expect(alerts[0]).toHaveTextContent('Overview temporarily unavailable');
    shouldFail = false;

    const retryButtons = screen.getAllByRole('button', { name: 'Retry' });
    await user.click(retryButtons[0]!);
    expect(
      await screen.findByText('Identity Gateway Migration', undefined, { timeout: 4000 }),
    ).toBeInTheDocument();
  });

  it('hides project creation CTA for read-only viewer role', async () => {
    document.cookie = 'csrf_token=viewer-csrf.sig; path=/';
    server.use(
      http.post('*/api/auth/refresh', () =>
        HttpResponse.json({
          ok: true,
          data: createSessionFixture(TEST_VIEWER_USER),
        }),
      ),
      http.get('*/api/dashboard/overview', () =>
        HttpResponse.json({
          ok: true,
          data: {
            summary: {
              ...TEST_DASHBOARD_SUMMARY,
              stats: { ...TEST_DASHBOARD_SUMMARY.stats, activeSessions: null },
              role: 'viewer',
              permissions: TEST_VIEWER_USER.permissions,
            },
            trackProgress: TEST_TRACK_PROGRESS,
            statusBreakdown: TEST_STATUS_BREAKDOWN,
            employeeStatus: TEST_EMPLOYEE_STATUS,
            activityTrend: TEST_ACTIVITY_TREND,
          },
        }),
      ),
    );

    renderDashboardRoute();

    expect(
      await screen.findByRole('heading', { name: 'Project & Administration Overview' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /new project/i })).not.toBeInTheDocument();
  });
});
