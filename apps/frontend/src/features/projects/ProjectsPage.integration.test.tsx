import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import {
  TEST_ADMIN_USER,
  TEST_PROJECTS,
  TEST_PROJECT_STATS,
  TEST_TEAM_MEMBERS,
  TEST_VIEWER_USER,
  createSessionFixture,
} from '../../test/fixtures';
import { server } from '../../test/mswServer';
import { renderWithProviders } from '../../test/renderWithProviders';
import { ProtectedRoute } from '../auth/ProtectedRoute';
import { ProjectsPage } from './ProjectsPage';

function renderProjectsRoute(initialEntry = '/projects') {
  return renderWithProviders(
    <Routes>
      <Route path="/login" element={<div>Login View</div>} />
      <Route path="/unauthorized" element={<div>Unauthorized View</div>} />
      <Route
        path="/projects"
        element={
          <ProtectedRoute permission="projects:read">
            <ProjectsPage />
          </ProtectedRoute>
        }
      />
    </Routes>,
    { initialEntries: [initialEntry] },
  );
}

describe('ProjectsPage integration', () => {
  it('loads projects, filters by status and department, and paginates via API query params', async () => {
    const user = userEvent.setup();
    document.cookie = 'csrf_token=admin-csrf.sig; path=/';

    const recordedQueries: Array<{ status: string | null; departmentId: string | null; page: string | null }> = [];

    server.use(
      http.post('*/api/auth/refresh', () =>
        HttpResponse.json({
          ok: true,
          data: createSessionFixture(TEST_ADMIN_USER),
        }),
      ),
      http.get('*/api/projects', ({ request }) => {
        const url = new URL(request.url);
        const status = url.searchParams.get('status');
        const departmentId = url.searchParams.get('departmentId');
        const page = url.searchParams.get('page') ?? '1';
        recordedQueries.push({ status, departmentId, page });

        const filtered = TEST_PROJECTS.filter((project) => {
          if (status && project.status !== status) return false;
          if (departmentId && project.department?.id !== departmentId) return false;
          return true;
        });

        const listForPage =
          page === '2'
            ? [
                {
                  ...TEST_PROJECTS[1],
                  id: 'prj_page_2',
                  name: 'Page Two Initiative',
                },
              ]
            : filtered;

        return HttpResponse.json({
          ok: true,
          data: {
            projects: listForPage,
            stats: TEST_PROJECT_STATS,
            pagination: {
              page: Number(page),
              limit: 6,
              total: 8,
              totalPages: 2,
            },
          },
        });
      }),
    );

    renderProjectsRoute();

    expect(
      await screen.findByText('Identity Gateway Migration', undefined, { timeout: 4000 }),
    ).toBeInTheDocument();
    expect(screen.getByText('Query Cache Observability')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /new project/i })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Next page' }));
    expect(await screen.findByText('Page Two Initiative')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /in progress \(1\)/i }));
    expect(
      await screen.findByText('Identity Gateway Migration', undefined, { timeout: 4000 }),
    ).toBeInTheDocument();
    expect(screen.queryByText('Query Cache Observability')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /filter by department/i }));
    await user.click(screen.getByRole('option', { name: 'Security' }));
    expect(
      await screen.findByText('Identity Gateway Migration', undefined, { timeout: 4000 }),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(recordedQueries).toContainEqual({ status: null, departmentId: null, page: '2' });
      expect(recordedQueries).toContainEqual({ status: 'in_progress', departmentId: null, page: '1' });
      expect(recordedQueries).toContainEqual({
        status: 'in_progress',
        departmentId: 'dept_sec',
        page: '1',
      });
    });
  });

  it('creates a new project through ProjectFormModal and refreshes workspace list', async () => {
    const user = userEvent.setup();
    document.cookie = 'csrf_token=admin-csrf.sig; path=/';

    const store = [...TEST_PROJECTS];

    server.use(
      http.post('*/api/auth/refresh', () =>
        HttpResponse.json({
          ok: true,
          data: createSessionFixture(TEST_ADMIN_USER),
        }),
      ),
      http.get('*/api/projects', () =>
        HttpResponse.json({
          ok: true,
          data: {
            projects: store,
            stats: { ...TEST_PROJECT_STATS, total: store.length },
            pagination: { page: 1, limit: 6, total: store.length, totalPages: 1 },
          },
        }),
      ),
      http.post('*/api/projects', async ({ request }) => {
        const body = (await request.json()) as {
          name: string;
          description: string;
          departmentId?: string | null;
          clientId?: string | null;
          status: 'in_progress';
          priority: 'high';
          progress: number;
        };

        const created = {
          ...TEST_PROJECTS[0],
          id: 'prj_new_1',
          name: body.name,
          description: body.description,
          status: body.status,
          priority: body.priority,
          progress: body.progress,
        };
        store.unshift(created);

        return HttpResponse.json({ ok: true, data: { project: created } }, { status: 201 });
      }),
    );

    renderProjectsRoute();

    expect(
      await screen.findByText('Identity Gateway Migration', undefined, { timeout: 4000 }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /new project/i }));

    await user.type(screen.getByLabelText('Project Name'), 'Audit Pipeline Hardening');
    await user.type(screen.getByLabelText('Description'), 'Automate signed export checks.');
    await user.click(screen.getByRole('button', { name: 'Create Project' }));

    expect(await screen.findByText('Audit Pipeline Hardening')).toBeInTheDocument();
    expect(screen.getByText('Created project "Audit Pipeline Hardening".')).toBeInTheDocument();
  });

  it('shows ErrorAlertBanner on API failure and recovers when user clicks Retry', async () => {
    const user = userEvent.setup();
    document.cookie = 'csrf_token=admin-csrf.sig; path=/';

    let shouldFail = true;

    server.use(
      http.post('*/api/auth/refresh', () =>
        HttpResponse.json({
          ok: true,
          data: createSessionFixture(TEST_ADMIN_USER),
        }),
      ),
      http.get('*/api/projects', () => {
        if (shouldFail) {
          return HttpResponse.json(
            { ok: false, error: { code: 'QUERY_REJECTED', message: 'Projects feed temporarily rejected' } },
            { status: 400 },
          );
        }
        return HttpResponse.json({
          ok: true,
          data: {
            projects: TEST_PROJECTS,
            stats: TEST_PROJECT_STATS,
            pagination: { page: 1, limit: 6, total: 2, totalPages: 1 },
          },
        });
      }),
    );

    renderProjectsRoute();

    expect(await screen.findByRole('alert')).toHaveTextContent('Projects feed temporarily rejected');
    shouldFail = false;

    await user.click(screen.getByRole('button', { name: 'Retry' }));
    expect(
      await screen.findByText('Identity Gateway Migration', undefined, { timeout: 4000 }),
    ).toBeInTheDocument();
  });

  it('hides project write buttons for read-only viewer accounts', async () => {
    document.cookie = 'csrf_token=viewer-csrf.sig; path=/';

    server.use(
      http.post('*/api/auth/refresh', () =>
        HttpResponse.json({
          ok: true,
          data: createSessionFixture(TEST_VIEWER_USER),
        }),
      ),
    );

    renderProjectsRoute();

    expect(
      await screen.findByText('Identity Gateway Migration', undefined, { timeout: 4000 }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /new project/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /import/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /edit identity gateway migration/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /delete identity gateway migration/i })).not.toBeInTheDocument();
  });

  it('hydrates filters from URL search params and renders loading skeleton before data resolves', async () => {
    document.cookie = 'csrf_token=admin-csrf.sig; path=/';
    let receivedParams = '';

    server.use(
      http.post('*/api/auth/refresh', () =>
        HttpResponse.json({
          ok: true,
          data: createSessionFixture(TEST_ADMIN_USER),
        }),
      ),
      http.get('*/api/projects', async ({ request }) => {
        receivedParams = new URL(request.url).searchParams.toString();
        await new Promise((resolve) => setTimeout(resolve, 40));
        return HttpResponse.json({
          ok: true,
          data: {
            projects: [TEST_PROJECTS[0]],
            stats: TEST_PROJECT_STATS,
            pagination: { page: 1, limit: 6, total: 1, totalPages: 1 },
          },
        });
      }),
    );

    renderProjectsRoute('/projects?status=in_progress&departmentId=dept_sec');

    expect(await screen.findByLabelText('Loading projects')).toBeInTheDocument();
    expect(
      await screen.findByText('Identity Gateway Migration', undefined, { timeout: 4000 }),
    ).toBeInTheDocument();
    expect(receivedParams).toContain('status=in_progress');
    expect(receivedParams).toContain('departmentId=dept_sec');
  });

  it('filters by clientId, sorts by deadline, and renders team lead plus working team counts', async () => {
    const user = userEvent.setup();
    document.cookie = 'csrf_token=admin-csrf.sig; path=/';

    const recordedParams: Array<{ clientId: string | null; sort: string | null }> = [];

    server.use(
      http.get('*/api/projects', ({ request }) => {
        const url = new URL(request.url);
        const clientId = url.searchParams.get('clientId');
        const sort = url.searchParams.get('sort');
        recordedParams.push({ clientId, sort });

        const projects = TEST_PROJECTS.filter((project) =>
          clientId ? project.client?.id === clientId : true,
        );

        return HttpResponse.json({
          ok: true,
          data: {
            projects,
            stats: TEST_PROJECT_STATS,
            pagination: { page: 1, limit: 8, total: projects.length, totalPages: 1 },
          },
        });
      }),
    );

    renderProjectsRoute();

    expect(
      await screen.findByText('Identity Gateway Migration', undefined, { timeout: 4000 }),
    ).toBeInTheDocument();
    expect(screen.getByText('2 employees')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /filter by client/i }));
    await user.click(screen.getByRole('option', { name: 'Northstar Logistics' }));

    expect(screen.getByText('Identity Gateway Migration')).toBeInTheDocument();
    expect(screen.queryByText('Query Cache Observability')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /sort projects/i }));
    await user.click(screen.getByRole('option', { name: 'Nearest Deadline' }));

    await waitFor(() => {
      expect(recordedParams).toContainEqual({ clientId: 'cli_1', sort: 'deadline' });
    });
  });

  it('loads multi-page dropdown options, searches employee filter options, and keeps dark focus contrast', async () => {
    const user = userEvent.setup();
    document.cookie = 'csrf_token=admin-csrf.sig; path=/';
    const recordedOwnerQueries: Array<string | null> = [];

    server.use(
      http.get('*/api/users', ({ request }) => {
        const url = new URL(request.url);
        const page = Number(url.searchParams.get('page') ?? '1');
        const users =
          page === 2
            ? [
                {
                  id: 'usr_page_2',
                  name: 'Zainab Scale Member',
                  email: 'zainab.scale@example.test',
                  role: 'viewer',
                  status: 'active',
                  department: { id: 'dept_sec', name: 'Security', code: 'SEC' },
                },
              ]
            : TEST_TEAM_MEMBERS;

        return HttpResponse.json({
          ok: true,
          data: {
            users,
            stats: { total: 3, active: 3, suspended: 0, admins: 1, managers: 1, viewers: 1 },
            pagination: { page, limit: 100, total: 3, totalPages: 2 },
          },
        });
      }),
      http.get('*/api/projects', ({ request }) => {
        const url = new URL(request.url);
        recordedOwnerQueries.push(url.searchParams.get('ownerId'));
        return HttpResponse.json({
          ok: true,
          data: {
            projects: TEST_PROJECTS,
            stats: TEST_PROJECT_STATS,
            pagination: { page: 1, limit: 8, total: TEST_PROJECTS.length, totalPages: 1 },
          },
        });
      }),
    );

    renderProjectsRoute();

    expect(
      await screen.findByText('Identity Gateway Migration', undefined, { timeout: 4000 }),
    ).toBeInTheDocument();

    const employeeTrigger = screen.getByRole('button', { name: /filter by employee/i });
    expect(employeeTrigger.className).toContain('dark:focus:bg-slate-800');

    await user.click(employeeTrigger);
    const searchBox = screen.getByRole('searchbox', { name: 'Search employees...' });
    await user.type(searchBox, 'Zainab Scale');
    await user.click(await screen.findByRole('option', { name: 'Zainab Scale Member' }));

    await waitFor(() => {
      expect(recordedOwnerQueries).toContain('usr_page_2');
    });
  });
});
