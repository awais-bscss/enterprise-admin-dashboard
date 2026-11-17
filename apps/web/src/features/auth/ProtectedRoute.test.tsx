import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { TEST_ADMIN_USER, TEST_VIEWER_USER, createSessionFixture } from '../../test/fixtures';
import { server } from '../../test/mswServer';
import { renderWithProviders } from '../../test/renderWithProviders';
import { PermissionGate } from './PermissionGate';
import { ProtectedRoute } from './ProtectedRoute';

function TestRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<div>Sign In Screen</div>} />
      <Route path="/unauthorized" element={<div>Access Restricted Screen</div>} />
      <Route
        path="/settings"
        element={
          <ProtectedRoute permission="settings:manage">
            <div>System Settings Console</div>
          </ProtectedRoute>
        }
      />
      <Route
        path="/projects"
        element={
          <ProtectedRoute permission="projects:read">
            <div>
              <span>Projects Read View</span>
              <PermissionGate permission="projects:write" fallback={<span>Read-only mode</span>}>
                <button type="button">New Project</button>
              </PermissionGate>
            </div>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

describe('ProtectedRoute and PermissionGate', () => {
  it('redirects unauthenticated users to /login when no session cookie exists', async () => {
    renderWithProviders(<TestRoutes />, { initialEntries: ['/settings'] });

    expect(await screen.findByText('Sign In Screen')).toBeInTheDocument();
  });

  it('redirects viewers lacking route permission to /unauthorized', async () => {
    document.cookie = 'csrf_token=viewer-csrf.sig; path=/';
    server.use(
      http.post('*/api/auth/refresh', () =>
        HttpResponse.json({
          ok: true,
          data: createSessionFixture(TEST_VIEWER_USER),
        }),
      ),
    );

    renderWithProviders(<TestRoutes />, { initialEntries: ['/settings'] });
    expect(await screen.findByText('Access Restricted Screen')).toBeInTheDocument();
  });

  it('hides write controls via PermissionGate for read-only viewer role', async () => {
    document.cookie = 'csrf_token=viewer-csrf.sig; path=/';
    server.use(
      http.post('*/api/auth/refresh', () =>
        HttpResponse.json({
          ok: true,
          data: createSessionFixture(TEST_VIEWER_USER),
        }),
      ),
    );

    renderWithProviders(<TestRoutes />, { initialEntries: ['/projects'] });
    expect(await screen.findByText('Projects Read View')).toBeInTheDocument();
    expect(screen.getByText('Read-only mode')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'New Project' })).not.toBeInTheDocument();
  });

  it('grants administrators access to restricted routes and write actions', async () => {
    document.cookie = 'csrf_token=admin-csrf.sig; path=/';
    server.use(
      http.post('*/api/auth/refresh', () =>
        HttpResponse.json({
          ok: true,
          data: createSessionFixture(TEST_ADMIN_USER),
        }),
      ),
    );

    renderWithProviders(<TestRoutes />, { initialEntries: ['/settings'] });
    expect(await screen.findByText('System Settings Console')).toBeInTheDocument();
  });

  it('renders write controls via PermissionGate when permission is granted', async () => {
    document.cookie = 'csrf_token=admin-csrf.sig; path=/';
    server.use(
      http.post('*/api/auth/refresh', () =>
        HttpResponse.json({
          ok: true,
          data: createSessionFixture(TEST_ADMIN_USER),
        }),
      ),
    );

    renderWithProviders(<TestRoutes />, { initialEntries: ['/projects'] });
    expect(await screen.findByRole('button', { name: 'New Project' })).toBeInTheDocument();
  });
});
