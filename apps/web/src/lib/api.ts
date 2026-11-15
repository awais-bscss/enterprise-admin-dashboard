import type { ApiErrorResponse, ApiSuccessResponse } from '../types/api';
import type { AuthSessionData } from '../types/auth';
import { getCookie } from './cookies';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api';
const CSRF_COOKIE_NAME = 'csrf_token';

let accessToken: string | null = null;
let sessionRefreshInFlight: Promise<AuthSessionData | null> | null = null;
let onSessionExpired: (() => void) | null = null;

export class ApiError extends Error {
  status: number;
  code: string;

  constructor(message: string, status: number, code = 'API_ERROR') {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export interface ApiRequestOptions extends RequestInit {
  skipAuth?: boolean;
  retry?: number;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function setSessionExpiredHandler(handler: (() => void) | null): void {
  onSessionExpired = handler;
}

function buildUrl(path: string): string {
  return `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
}

async function parseError(response: Response): Promise<ApiError> {
  const payload = (await response.json().catch(() => null)) as ApiErrorResponse | null;
  return new ApiError(
    payload?.error?.message ?? `Request failed (${response.status})`,
    response.status,
    payload?.error?.code ?? 'REQUEST_FAILED',
  );
}

// Coalesce concurrent refresh calls so rotated refresh tokens are never replayed.
export async function refreshSession(): Promise<AuthSessionData | null> {
  if (sessionRefreshInFlight) {
    return sessionRefreshInFlight;
  }

  sessionRefreshInFlight = (async () => {
    const csrf = getCookie(CSRF_COOKIE_NAME);
    const headers = new Headers();
    if (csrf) {
      headers.set('x-csrf-token', csrf);
    }

    const response = await fetch(buildUrl('/auth/refresh'), {
      method: 'POST',
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      setAccessToken(null);
      return null;
    }

    const payload = (await response.json()) as ApiSuccessResponse<AuthSessionData>;
    setAccessToken(payload.data.accessToken);
    return payload.data;
  })();

  try {
    return await sessionRefreshInFlight;
  } finally {
    sessionRefreshInFlight = null;
  }
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { skipAuth = false, retry, ...init } = options;
  const method = (init.method ?? 'GET').toUpperCase();
  const maxRetries = retry ?? (method === 'GET' || method === 'HEAD' ? 1 : 0);

  let attempt = 0;

  while (true) {
    const headers = new Headers(init.headers);

    if (init.body && !headers.has('Content-Type') && !(init.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    if (!skipAuth && accessToken && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${accessToken}`);
    }

    try {
      const response = await fetch(buildUrl(path), {
        ...init,
        method,
        headers,
        credentials: 'include',
      });

      if (response.status === 401 && !skipAuth) {
        const refreshed = await refreshSession();
        if (refreshed) {
          const retryHeaders = new Headers(headers);
          retryHeaders.set('Authorization', `Bearer ${refreshed.accessToken}`);
          const retried = await fetch(buildUrl(path), {
            ...init,
            method,
            headers: retryHeaders,
            credentials: 'include',
          });
          if (retried.ok) {
            return (await retried.json()) as T;
          }
          throw await parseError(retried);
        }

        onSessionExpired?.();
        throw await parseError(response);
      }

      if (!response.ok) {
        if (response.status >= 500 && attempt < maxRetries && !init.signal?.aborted) {
          attempt += 1;
          await new Promise((resolve) => setTimeout(resolve, 250 * attempt));
          continue;
        }
        throw await parseError(response);
      }

      return (await response.json()) as T;
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw err;
      }
      if (err instanceof ApiError) {
        throw err;
      }
      if (attempt < maxRetries && !init.signal?.aborted) {
        attempt += 1;
        await new Promise((resolve) => setTimeout(resolve, 250 * attempt));
        continue;
      }
      throw new ApiError('Network request failed', 0, 'NETWORK_ERROR');
    }
  }
}
