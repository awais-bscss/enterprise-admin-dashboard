import { apiRequest } from '../../lib/api';
import type { ApiSuccessResponse } from '../../types/api';
import type { DirectoryPreviewUser, Role, UsersDirectoryStats } from '../../types/auth';

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: Role;
  status?: 'active' | 'suspended';
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  role?: Role;
  status?: 'active' | 'suspended';
  password?: string;
}

export async function listUsers(
  filters: { q?: string; role?: string; status?: string; signal?: AbortSignal } = {},
): Promise<{ users: DirectoryPreviewUser[]; stats: UsersDirectoryStats }> {
  const params = new URLSearchParams();
  if (filters.q?.trim()) params.set('q', filters.q.trim());
  if (filters.role) params.set('role', filters.role);
  if (filters.status) params.set('status', filters.status);
  const query = params.toString();

  const res = await apiRequest<
    ApiSuccessResponse<{ users: DirectoryPreviewUser[]; stats: UsersDirectoryStats }>
  >(`/users${query ? `?${query}` : ''}`, { signal: filters.signal });
  return res.data;
}

export async function createUser(payload: CreateUserInput): Promise<DirectoryPreviewUser> {
  const res = await apiRequest<ApiSuccessResponse<{ user: DirectoryPreviewUser }>>('/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.data.user;
}

export async function updateUser(
  id: string,
  payload: UpdateUserInput,
): Promise<DirectoryPreviewUser> {
  const res = await apiRequest<ApiSuccessResponse<{ user: DirectoryPreviewUser }>>(`/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  return res.data.user;
}

export async function deleteUser(id: string): Promise<string> {
  const res = await apiRequest<ApiSuccessResponse<{ deletedId: string }>>(`/users/${id}`, {
    method: 'DELETE',
  });
  return res.data.deletedId;
}
