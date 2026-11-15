import { apiRequest, refreshSession } from '../../lib/api';
import { getCookie } from '../../lib/cookies';
import type { ApiSuccessResponse } from '../../types/api';
import type { AuthSessionData, AuthUser } from '../../types/auth';

export async function loginRequest(email: string, password: string): Promise<AuthSessionData> {
  const res = await apiRequest<ApiSuccessResponse<AuthSessionData>>('/auth/login', {
    method: 'POST',
    skipAuth: true,
    body: JSON.stringify({ email, password }),
  });
  return res.data;
}

export function refreshSessionRequest(): Promise<AuthSessionData | null> {
  return refreshSession();
}

export async function logoutRequest(): Promise<void> {
  const csrf = getCookie('csrf_token');
  const headers: Record<string, string> = {};
  if (csrf) {
    headers['x-csrf-token'] = csrf;
  }

  await apiRequest<{ ok: true }>('/auth/logout', {
    method: 'POST',
    skipAuth: true,
    headers,
  });
}

export async function fetchCurrentUser(): Promise<AuthUser> {
  const res = await apiRequest<ApiSuccessResponse<{ user: AuthUser }>>('/auth/me');
  return res.data.user;
}

export async function updateProfileRequest(payload: {
  name?: string;
  currentPassword?: string;
  newPassword?: string;
}): Promise<AuthUser> {
  const res = await apiRequest<ApiSuccessResponse<{ user: AuthUser }>>('/auth/profile', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  return res.data.user;
}
