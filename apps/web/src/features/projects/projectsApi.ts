import { apiRequest } from '../../lib/api';
import type { ApiSuccessResponse } from '../../types/api';
import type {
  ProjectCategory,
  ProjectItem,
  ProjectPriority,
  ProjectStatus,
} from '../../types/auth';

export interface ProjectInput {
  name: string;
  description: string;
  category: ProjectCategory;
  status: ProjectStatus;
  priority: ProjectPriority;
  tasksTotal: number;
  tasksCompleted: number;
  ownerId?: string;
  dueDate?: string | null;
}

export interface ProjectFilters {
  q?: string;
  category?: string;
  status?: string;
  signal?: AbortSignal;
}

export async function listProjects(filters: ProjectFilters = {}): Promise<ProjectItem[]> {
  const params = new URLSearchParams();
  if (filters.q?.trim()) params.set('q', filters.q.trim());
  if (filters.category) params.set('category', filters.category);
  if (filters.status) params.set('status', filters.status);
  const query = params.toString();

  const res = await apiRequest<ApiSuccessResponse<{ projects: ProjectItem[] }>>(
    `/projects${query ? `?${query}` : ''}`,
    { signal: filters.signal },
  );
  return res.data.projects;
}

export async function createProject(payload: ProjectInput): Promise<ProjectItem> {
  const res = await apiRequest<ApiSuccessResponse<{ project: ProjectItem }>>('/projects', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.data.project;
}

export async function updateProject(
  id: string,
  payload: Partial<ProjectInput>,
): Promise<ProjectItem> {
  const res = await apiRequest<ApiSuccessResponse<{ project: ProjectItem }>>(`/projects/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  return res.data.project;
}

export async function deleteProject(id: string): Promise<string> {
  const res = await apiRequest<ApiSuccessResponse<{ deletedId: string }>>(`/projects/${id}`, {
    method: 'DELETE',
  });
  return res.data.deletedId;
}
