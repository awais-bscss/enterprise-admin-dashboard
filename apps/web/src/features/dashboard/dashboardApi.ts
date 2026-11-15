import { apiRequest } from '../../lib/api';
import type { ApiSuccessResponse } from '../../types/api';
import type { DashboardOverviewData } from '../../types/auth';

export async function getDashboardOverview(signal?: AbortSignal): Promise<DashboardOverviewData> {
  const res = await apiRequest<ApiSuccessResponse<DashboardOverviewData>>('/dashboard/overview', {
    signal,
  });
  return res.data;
}
