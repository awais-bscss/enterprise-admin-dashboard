import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { TEST_ADMIN_USER, TEST_VIEWER_USER, createSessionFixture } from '../../test/fixtures';
import { server } from '../../test/mswServer';
import { renderWithProviders } from '../../test/renderWithProviders';
import { LoginPage } from './LoginPage';

function renderLoginHarness(requestedFrom?: string) {
  const initialEntry = requestedFrom
    ? { pathname: '/login', state: { from: { pathname: requestedFrom } } }
    : '/login';

  return renderWithProviders(
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/dashboard" element={<div>Overview Workspace</div>} />
      <Route path="/reports" element={<div>Reports Workspace</div>} />
    </Routes>,
    { initialEntries: [initialEntry] },
  );
}

describe('LoginPage integration', () => {
  it('validates email format on submit without calling login API', async () => {
    const user = userEvent.setup();
    let loginCalls = 0;

    server.use(
      http.post('*/api/auth/login', () => {
        loginCalls += 1;
        return HttpResponse.json({ ok: true, data: createSessionFixture(TEST_ADMIN_USER) });
      }),
    );

    renderLoginHarness();

    await user.type(screen.getByLabelText('Work email'), 'invalid-email');
    await user.type(screen.getByLabelText('Password'), 'secret123');
    await user.click(screen.getByRole('button', { name: /^login$/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Please enter a valid work email address.',
    );
    expect(loginCalls).toBe(0);
  });

  it('displays normalized server error message when login credentials fail', async () => {
    const user = userEvent.setup();

    server.use(
      http.post('*/api/auth/login', () =>
        HttpResponse.json(
          { ok: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } },
          { status: 401 },
        ),
      ),
    );

    renderLoginHarness();

    await user.type(screen.getByLabelText('Work email'), TEST_ADMIN_USER.email);
    await user.type(screen.getByLabelText('Password'), 'WrongPass99');
    await user.click(screen.getByRole('button', { name: /^login$/i }));

    const alerts = await screen.findAllByRole('alert');
    expect(alerts.some((node) => node.textContent?.includes('Invalid email or password'))).toBe(
      true,
    );
    expect(screen.getByRole('heading', { name: /enterprise access/i })).toBeInTheDocument();
  });

  it('redirects admin back to permitted requested route after login', async () => {
    const user = userEvent.setup();

    server.use(
      http.post('*/api/auth/login', () =>
        HttpResponse.json({
          ok: true,
          data: createSessionFixture(TEST_ADMIN_USER),
        }),
      ),
    );

    renderLoginHarness('/reports');
    await user.type(screen.getByLabelText('Work email'), TEST_ADMIN_USER.email);
    await user.type(screen.getByLabelText('Password'), 'ValidPass99!');
    await user.click(screen.getByRole('button', { name: /^login$/i }));

    expect(await screen.findByText('Reports Workspace')).toBeInTheDocument();
  });

  it('falls back to /dashboard instead of restricted route when viewer logs in', async () => {
    const user = userEvent.setup();

    server.use(
      http.post('*/api/auth/login', () =>
        HttpResponse.json({
          ok: true,
          data: createSessionFixture(TEST_VIEWER_USER),
        }),
      ),
    );

    renderLoginHarness('/reports');
    await user.type(screen.getByLabelText('Work email'), TEST_VIEWER_USER.email);
    await user.type(screen.getByLabelText('Password'), 'ValidPass99!');
    await user.click(screen.getByRole('button', { name: /^login$/i }));

    expect(await screen.findByText('Overview Workspace')).toBeInTheDocument();
  });

  it('fills credentials from env-configured quick dev buttons when provided and omits them otherwise', async () => {
    const user = userEvent.setup();
    vi.stubEnv('VITE_DEV_ADMIN_EMAIL', 'dev-admin@example.test');
    vi.stubEnv('VITE_DEV_ADMIN_PASSWORD', 'DevPass123!');

    try {
      renderLoginHarness();
      const quickButton = screen.getByRole('button', { name: /admin/i });
      await user.click(quickButton);

      expect(screen.getByLabelText('Work email')).toHaveValue('dev-admin@example.test');
      expect(screen.getByLabelText('Password')).toHaveValue('DevPass123!');
    } finally {
      vi.unstubAllEnvs();
    }
  });
});
