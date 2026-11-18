import { http, HttpResponse } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { server } from '../test/mswServer';
import { TEST_ADMIN_USER, createSessionFixture } from '../test/fixtures';
import { ApiError, api, setAccessToken, setSessionExpiredHandler } from './api';

describe('centralized API client', () => {
  it('injects Bearer token, cleans query params, and respects skipAuth and withCsrf', async () => {
    setAccessToken('initial-jwt');
    document.cookie = 'csrf_token=csrf-nonce.sig; path=/';

    let capturedUrl = '';
    let capturedAuth: string | null = null;
    let capturedCsrf: string | null = null;
    let capturedPublicAuth: string | null = null;

    server.use(
      http.get('*/api/projects', ({ request }) => {
        capturedUrl = request.url;
        capturedAuth = request.headers.get('authorization');
        capturedCsrf = request.headers.get('x-csrf-token');
        return HttpResponse.json({ ok: true, data: { items: [] } });
      }),
      http.get('*/api/public-health', ({ request }) => {
        capturedPublicAuth = request.headers.get('authorization');
        return HttpResponse.json({ ok: true, data: { status: 'healthy' } });
      }),
    );

    const data = await api.get<{ items: unknown[] }>('/projects', {
      withCsrf: true,
      params: {
        q: '   ',
        status: ' in_progress ',
        page: 1,
        archived: false,
        empty: null,
        missing: undefined,
      },
    });

    expect(data.items).toEqual([]);
    const parsedUrl = new URL(capturedUrl);
    expect(parsedUrl.searchParams.get('status')).toBe('in_progress');
    expect(parsedUrl.searchParams.get('page')).toBe('1');
    expect(parsedUrl.searchParams.get('archived')).toBe('false');
    expect(parsedUrl.searchParams.has('q')).toBe(false);
    expect(parsedUrl.searchParams.has('empty')).toBe(false);
    expect(parsedUrl.searchParams.has('missing')).toBe(false);
    expect(capturedAuth).toBe('Bearer initial-jwt');
    expect(capturedCsrf).toBe('csrf-nonce.sig');

    await api.get('/public-health', { skipAuth: true });
    expect(capturedPublicAuth).toBeNull();
  });

  it('coalesces concurrent 401 responses into one refresh flight and replays both requests', async () => {
    setAccessToken('expired-jwt');
    let refreshCount = 0;

    server.use(
      http.post('*/api/auth/refresh', async () => {
        refreshCount += 1;
        await new Promise((resolve) => setTimeout(resolve, 25));
        return HttpResponse.json({
          ok: true,
          data: createSessionFixture(TEST_ADMIN_USER, 'fresh-jwt'),
        });
      }),
      http.get('*/api/dashboard/overview', ({ request }) => {
        if (request.headers.get('authorization') === 'Bearer expired-jwt') {
          return HttpResponse.json(
            { ok: false, error: { code: 'TOKEN_EXPIRED', message: 'Expired' } },
            { status: 401 },
          );
        }
        return HttpResponse.json({ ok: true, data: { section: 'overview' } });
      }),
      http.get('*/api/projects', ({ request }) => {
        if (request.headers.get('authorization') === 'Bearer expired-jwt') {
          return HttpResponse.json(
            { ok: false, error: { code: 'TOKEN_EXPIRED', message: 'Expired' } },
            { status: 401 },
          );
        }
        return HttpResponse.json({ ok: true, data: { section: 'projects' } });
      }),
    );

    const [overview, projects] = await Promise.all([
      api.get<{ section: string }>('/dashboard/overview'),
      api.get<{ section: string }>('/projects'),
    ]);

    expect(refreshCount).toBe(1);
    expect(overview.section).toBe('overview');
    expect(projects.section).toBe('projects');
  });

  it('invokes onSessionExpired once across concurrent failing refresh calls and throws normalized ApiError', async () => {
    setAccessToken('stale-jwt');
    const expiredHandler = vi.fn();
    setSessionExpiredHandler(expiredHandler);

    server.use(
      http.post('*/api/auth/refresh', async () => {
        await new Promise((resolve) => setTimeout(resolve, 15));
        return HttpResponse.json(
          { ok: false, error: { code: 'INVALID_SESSION', message: 'Session is invalid' } },
          { status: 401 },
        );
      }),
      http.get('*/api/users', () =>
        HttpResponse.json(
          { ok: false, error: { code: 'TOKEN_EXPIRED', message: 'Access token expired' } },
          { status: 401 },
        ),
      ),
      http.get('*/api/projects', () =>
        HttpResponse.json(
          { ok: false, error: { code: 'TOKEN_EXPIRED', message: 'Access token expired' } },
          { status: 401 },
        ),
      ),
    );

    const results = await Promise.allSettled([api.get('/users'), api.get('/projects')]);
    expect(results[0]?.status).toBe('rejected');
    expect(results[1]?.status).toBe('rejected');
    if (results[0]?.status === 'rejected') {
      expect(results[0].reason).toMatchObject({
        name: 'ApiError',
        status: 401,
        code: 'TOKEN_EXPIRED',
        message: 'Access token expired',
      });
    }

    expect(expiredHandler).toHaveBeenCalledTimes(1);
  });

  it('retries transient GET 503 once but does not replay failing POST writes', async () => {
    setAccessToken('valid-jwt');
    let getAttempts = 0;
    let postAttempts = 0;

    server.use(
      http.get('*/api/settings', () => {
        getAttempts += 1;
        if (getAttempts === 1) {
          return HttpResponse.json(
            { ok: false, error: { code: 'TEMP_UNAVAILABLE', message: 'Temporary blip' } },
            { status: 503 },
          );
        }
        return HttpResponse.json({ ok: true, data: { recovered: true } });
      }),
      http.post('*/api/projects', () => {
        postAttempts += 1;
        return HttpResponse.json(
          { ok: false, error: { code: 'SERVER_ERROR', message: 'Write failed' } },
          { status: 503 },
        );
      }),
    );

    const result = await api.get<{ recovered: boolean }>('/settings');
    expect(getAttempts).toBe(2);
    expect(result.recovered).toBe(true);

    await expect(api.post('/projects', { name: 'Alpha' })).rejects.toBeInstanceOf(ApiError);
    expect(postAttempts).toBe(1);
  });

  it('preserves cancellation when AbortController aborts an in-flight request', async () => {
    const controller = new AbortController();

    server.use(
      http.get('*/api/slow', async () => {
        await new Promise((resolve) => setTimeout(resolve, 200));
        return HttpResponse.json({ ok: true, data: {} });
      }),
    );

    const pending = api.get('/slow', { signal: controller.signal });
    controller.abort();

    await expect(pending).rejects.toMatchObject({ code: 'ERR_CANCELED' });
  });
});
