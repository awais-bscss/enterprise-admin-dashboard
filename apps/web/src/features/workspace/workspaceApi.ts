import { ApiError, apiRequest, getAccessToken, refreshSession } from '../../lib/api';
import type { ApiSuccessResponse } from '../../types/api';
import type { AuditLogItem, WorkspaceSettingsData } from '../../types/auth';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api';

export async function listAuditLogs(
  filters: { resourceType?: string; signal?: AbortSignal } = {},
): Promise<AuditLogItem[]> {
  const params = new URLSearchParams();
  if (filters.resourceType) params.set('resourceType', filters.resourceType);
  const query = params.toString();

  const res = await apiRequest<ApiSuccessResponse<{ logs: AuditLogItem[] }>>(
    `/audit${query ? `?${query}` : ''}`,
    { signal: filters.signal },
  );
  return res.data.logs;
}

export async function getWorkspaceSettings(signal?: AbortSignal): Promise<WorkspaceSettingsData> {
  const res = await apiRequest<ApiSuccessResponse<{ settings: WorkspaceSettingsData }>>(
    '/settings',
    { signal },
  );
  return res.data.settings;
}

export async function updateWorkspaceSettings(
  payload: Partial<Omit<WorkspaceSettingsData, 'updatedByName' | 'updatedAt'>>,
): Promise<WorkspaceSettingsData> {
  const res = await apiRequest<ApiSuccessResponse<{ settings: WorkspaceSettingsData }>>(
    '/settings',
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
  );
  return res.data.settings;
}

function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export async function exportJsonReport(): Promise<Record<string, unknown>> {
  const res = await apiRequest<ApiSuccessResponse<Record<string, unknown>>>(
    '/reports/export?format=json',
  );
  return res.data;
}

export async function downloadJsonReport(): Promise<void> {
  const payload = await exportJsonReport();
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  triggerBlobDownload(blob, 'enterprise-compliance-report.json');
}

export async function downloadCsvReport(): Promise<void> {
  let token = getAccessToken();
  const makeRequest = (bearer: string | null) =>
    fetch(`${API_BASE}/reports/export?format=csv`, {
      credentials: 'include',
      headers: bearer ? { Authorization: `Bearer ${bearer}` } : undefined,
    });

  let response = await makeRequest(token);
  if (response.status === 401) {
    const refreshed = await refreshSession();
    token = refreshed?.accessToken ?? null;
    if (token) {
      response = await makeRequest(token);
    }
  }

  if (!response.ok) {
    throw new ApiError(`Export failed (${response.status})`, response.status);
  }

  const blob = await response.blob();
  triggerBlobDownload(blob, 'enterprise-compliance-report.csv');
}
