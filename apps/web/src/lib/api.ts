import axios, {
  AxiosHeaders,
  type AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios';
import type { ApiErrorResponse, ApiSuccessResponse } from '../types/api';
import type { AuthSessionData } from '../types/auth';
import { getCookie } from './cookies';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api';
const CSRF_COOKIE_NAME = 'csrf_token';

let accessToken: string | null = null;
let sessionRefreshInFlight: Promise<AuthSessionData | null> | null = null;
let onSessionExpired: (() => void) | null = null;
let sessionExpiredNotified = false;

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

export type QueryParams = Record<string, string | number | boolean | null | undefined>;

export interface RequestOptions {
  params?: QueryParams;
  signal?: AbortSignal;
  skipAuth?: boolean;
  withCsrf?: boolean;
  retry?: number;
}

interface InternalRequestConfig extends InternalAxiosRequestConfig {
  skipAuth?: boolean;
  withCsrf?: boolean;
  retry?: number;
  _authRetried?: boolean;
  _attempt?: number;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
  if (token) {
    sessionExpiredNotified = false;
  }
}

export function setSessionExpiredHandler(handler: (() => void) | null): void {
  onSessionExpired = handler;
  sessionExpiredNotified = false;
}

function cleanParams(params?: QueryParams): Record<string, string | number | boolean> | undefined {
  if (!params) return undefined;
  const cleaned: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) continue;
      cleaned[key] = trimmed;
      continue;
    }
    cleaned[key] = value;
  }
  return Object.keys(cleaned).length > 0 ? cleaned : undefined;
}

async function extractErrorPayload(data: unknown): Promise<ApiErrorResponse | null> {
  if (!data) return null;
  if (typeof Blob !== 'undefined' && data instanceof Blob) {
    try {
      const text = await data.text();
      return JSON.parse(text) as ApiErrorResponse;
    } catch {
      return null;
    }
  }
  if (typeof data === 'object' && 'error' in data) {
    return data as ApiErrorResponse;
  }
  return null;
}

async function normalizeAxiosError(error: AxiosError): Promise<ApiError> {
  if (!error.response) {
    const isTimeout = error.code === 'ECONNABORTED';
    return new ApiError(
      isTimeout ? 'Request timed out. Please try again.' : 'Network request failed',
      0,
      isTimeout ? 'REQUEST_TIMEOUT' : 'NETWORK_ERROR',
    );
  }

  const status = error.response.status;
  const payload = await extractErrorPayload(error.response.data);
  if (payload?.error?.message) {
    return new ApiError(
      payload.error.message,
      status,
      payload.error.code ?? 'REQUEST_FAILED',
    );
  }

  if (status === 502 || status === 503 || status === 504) {
    return new ApiError(
      `API server unreachable (${status}). Make sure the backend server is running.`,
      status,
      'SERVICE_UNAVAILABLE',
    );
  }

  return new ApiError(`Request failed (${status})`, status, 'REQUEST_FAILED');
}

// Coalesce concurrent refresh calls so rotated refresh tokens are never replayed.
export async function refreshSession(): Promise<AuthSessionData | null> {
  if (sessionRefreshInFlight) {
    return sessionRefreshInFlight;
  }

  sessionRefreshInFlight = (async () => {
    const csrf = getCookie(CSRF_COOKIE_NAME);
    const headers: Record<string, string> = {};
    if (csrf) {
      headers['x-csrf-token'] = csrf;
    }

    try {
      const response = await axios.post<ApiSuccessResponse<AuthSessionData>>(
        `${API_BASE}/auth/refresh`,
        undefined,
        {
          headers,
          withCredentials: true,
          timeout: 15_000,
        },
      );
      setAccessToken(response.data.data.accessToken);
      return response.data.data;
    } catch {
      setAccessToken(null);
      return null;
    }
  })();

  try {
    return await sessionRefreshInFlight;
  } finally {
    sessionRefreshInFlight = null;
  }
}

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  timeout: 15_000,
});

apiClient.interceptors.request.use((config) => {
  const internalConfig = config as InternalRequestConfig;
  const headers = AxiosHeaders.from(internalConfig.headers);

  if (internalConfig.withCsrf) {
    const csrf = getCookie(CSRF_COOKIE_NAME);
    if (csrf && !headers.has('x-csrf-token')) {
      headers.set('x-csrf-token', csrf);
    }
  }

  if (!internalConfig.skipAuth && accessToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  internalConfig.headers = headers;
  return internalConfig;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (axios.isCancel(error)) {
      return Promise.reject(error);
    }

    if (!axios.isAxiosError(error)) {
      return Promise.reject(new ApiError('Unexpected network failure', 0, 'NETWORK_ERROR'));
    }

    const originalConfig = error.config as InternalRequestConfig | undefined;
    const status = error.response?.status ?? 0;

    if (
      status === 401 &&
      originalConfig &&
      !originalConfig.skipAuth &&
      !originalConfig._authRetried
    ) {
      originalConfig._authRetried = true;
      const refreshed = await refreshSession();
      if (refreshed) {
        const headers = AxiosHeaders.from(originalConfig.headers);
        headers.set('Authorization', `Bearer ${refreshed.accessToken}`);
        originalConfig.headers = headers;
        return apiClient.request(originalConfig);
      }

      if (!sessionExpiredNotified) {
        sessionExpiredNotified = true;
        onSessionExpired?.();
      }
      return Promise.reject(await normalizeAxiosError(error));
    }

    const method = (originalConfig?.method ?? 'GET').toUpperCase();
    const maxRetries = originalConfig?.retry ?? (method === 'GET' || method === 'HEAD' ? 1 : 0);
    const attempt = originalConfig?._attempt ?? 0;
    const isTransient = status >= 500 || (!error.response && error.code !== 'ERR_CANCELED');

    if (
      originalConfig &&
      isTransient &&
      attempt < maxRetries &&
      !originalConfig.signal?.aborted
    ) {
      const nextAttempt = attempt + 1;
      originalConfig._attempt = nextAttempt;
      await new Promise((resolve) => setTimeout(resolve, 250 * nextAttempt));
      return apiClient.request(originalConfig);
    }

    return Promise.reject(await normalizeAxiosError(error));
  },
);

type ExtendedConfig = AxiosRequestConfig & {
  skipAuth?: boolean;
  withCsrf?: boolean;
  retry?: number;
};

function buildConfig(
  url: string,
  method: ExtendedConfig['method'],
  options: RequestOptions = {},
  data?: unknown,
): ExtendedConfig {
  return {
    url: url.startsWith('/') ? url : `/${url}`,
    method,
    data,
    params: cleanParams(options.params),
    signal: options.signal,
    skipAuth: options.skipAuth ?? false,
    withCsrf: options.withCsrf ?? false,
    retry: options.retry,
  };
}

async function requestEnvelope<T>(config: ExtendedConfig): Promise<T> {
  const response = await apiClient.request<ApiSuccessResponse<T>>(config);
  return response.data.data;
}

export const api = {
  get<T>(url: string, options?: RequestOptions): Promise<T> {
    return requestEnvelope<T>(buildConfig(url, 'GET', options));
  },
  post<T>(url: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return requestEnvelope<T>(buildConfig(url, 'POST', options, body));
  },
  patch<T>(url: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return requestEnvelope<T>(buildConfig(url, 'PATCH', options, body));
  },
  delete<T>(url: string, options?: RequestOptions): Promise<T> {
    return requestEnvelope<T>(buildConfig(url, 'DELETE', options));
  },
  blob(url: string, options?: RequestOptions): Promise<Blob> {
    return apiClient
      .request<Blob>({
        ...buildConfig(url, 'GET', options),
        responseType: 'blob',
      })
      .then((res) => res.data);
  },
};
