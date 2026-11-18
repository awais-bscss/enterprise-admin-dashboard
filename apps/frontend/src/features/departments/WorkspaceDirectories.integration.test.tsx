import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import {
  TEST_ADMIN_USER,
  TEST_CLIENTS,
  TEST_DEPARTMENTS,
  TEST_PAGINATION,
  TEST_TEAM_MEMBERS,
  TEST_VIEWER_USER,
  createSessionFixture,
} from '../../test/fixtures';
import { server } from '../../test/mswServer';
import { renderWithProviders } from '../../test/renderWithProviders';
import { ProtectedRoute } from '../auth/ProtectedRoute';
import { ClientsPage } from '../clients/ClientsPage';
import { DirectoryPage } from '../directory/DirectoryPage';
import { DepartmentsPage } from './DepartmentsPage';

describe('Cross-entity workspace directories integration', () => {
  it('renders DepartmentsPage with linked drill-down pills to employees and projects', async () => {
    document.cookie = 'csrf_token=admin-csrf.sig; path=/';

    renderWithProviders(
      <Routes>
        <Route
          path="/departments"
          element={
            <ProtectedRoute permission="departments:read">
              <DepartmentsPage />
            </ProtectedRoute>
          }
        />
      </Routes>,
      { initialEntries: ['/departments'] },
    );

    expect(await screen.findByRole('heading', { name: 'Departments' })).toBeInTheDocument();
    expect(await screen.findByText('Security')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add department/i })).toBeInTheDocument();

    const empLinks = screen.getAllByRole('link', { name: /1 employee/i });
    expect(empLinks[0]).toHaveAttribute('href', '/employees?departmentId=dept_sec');

    const prjLinks = screen.getAllByRole('link', { name: /1 project/i });
    expect(prjLinks[0]).toHaveAttribute('href', '/projects?departmentId=dept_sec');
  });

  it('renders ClientsPage with client-filtered project links and hides write controls for viewer', async () => {
    document.cookie = 'csrf_token=viewer-csrf.sig; path=/';
    server.use(
      http.post('*/api/auth/refresh', () =>
        HttpResponse.json({ ok: true, data: createSessionFixture(TEST_VIEWER_USER) }),
      ),
    );

    renderWithProviders(
      <Routes>
        <Route
          path="/clients"
          element={
            <ProtectedRoute permission="clients:read">
              <ClientsPage />
            </ProtectedRoute>
          }
        />
      </Routes>,
      { initialEntries: ['/clients'] },
    );

    expect(await screen.findByRole('heading', { name: 'Clients' })).toBeInTheDocument();
    expect(await screen.findByText('Northstar Logistics')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /add client/i })).not.toBeInTheDocument();

    const clientProjectLink = screen.getByRole('link', { name: /1 project/i });
    expect(clientProjectLink).toHaveAttribute('href', '/projects?clientId=cli_1');
  });

  it('filters DirectoryPage employees by clickable department badge and links assigned project counts', async () => {
    const user = userEvent.setup();
    document.cookie = 'csrf_token=admin-csrf.sig; path=/';
    const capturedQueries: Array<string | null> = [];

    server.use(
      http.get('*/api/users', ({ request }) => {
        const deptId = new URL(request.url).searchParams.get('departmentId');
        capturedQueries.push(deptId);
        const rows = [
          { ...TEST_TEAM_MEMBERS[0]!, projectCount: 2 },
          { ...TEST_TEAM_MEMBERS[1]!, projectCount: 0 },
        ].filter((row) => !deptId || row.department?.id === deptId);

        return HttpResponse.json({
          ok: true,
          data: {
            users: rows,
            stats: { total: 2, active: 2, suspended: 0, admins: 1, managers: 1, viewers: 0 },
            pagination: TEST_PAGINATION,
          },
        });
      }),
      http.get('*/api/departments', () =>
        HttpResponse.json({
          ok: true,
          data: {
            departments: TEST_DEPARTMENTS,
            stats: { total: 2, active: 2, inactive: 0 },
            pagination: TEST_PAGINATION,
          },
        }),
      ),
      http.get('*/api/clients', () =>
        HttpResponse.json({
          ok: true,
          data: {
            clients: TEST_CLIENTS,
            stats: { total: 2, active: 2, inactive: 0 },
            pagination: TEST_PAGINATION,
          },
        }),
      ),
    );

    renderWithProviders(
      <Routes>
        <Route
          path="/employees"
          element={
            <ProtectedRoute permission="users:read">
              <DirectoryPage />
            </ProtectedRoute>
          }
        />
      </Routes>,
      { initialEntries: ['/employees'] },
    );

    expect(
      await screen.findByRole('heading', { name: /employees & role management/i }),
    ).toBeInTheDocument();
    expect(await screen.findByText(TEST_ADMIN_USER.name)).toBeInTheDocument();

    const projectsLink = screen.getByRole('link', { name: /2 projects/i });
    expect(projectsLink).toHaveAttribute('href', `/projects?ownerId=${TEST_ADMIN_USER.id}`);

    await user.click(screen.getByRole('button', { name: /^Security$/ }));
    await waitFor(() => {
      expect(capturedQueries).toContain('dept_sec');
    });
  });
});
