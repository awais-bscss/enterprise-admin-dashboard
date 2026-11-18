import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '../components/toast/toastContext';
import { getErrorMessage } from '../lib/errors';
import { queryKeys } from '../lib/queryKeys';
import { dashboardService } from '../services/apiService';

export function useDashboardOverview() {
  const toast = useToast();

  const overviewQuery = useQuery({
    queryKey: queryKeys.dashboard.overview,
    queryFn: ({ signal }) => dashboardService.getOverview(signal),
  });

  const handleRefresh = useCallback(async () => {
    const result = await overviewQuery.refetch();
    if (result.error) {
      toast.error(getErrorMessage(result.error, 'Unable to refresh dashboard metrics.'));
      return;
    }
    toast.info('Dashboard metrics refreshed.');
  }, [overviewQuery, toast]);

  const data = overviewQuery.data ?? null;
  const retry = () => {
    void overviewQuery.refetch();
  };
  const sharedError = overviewQuery.error
    ? getErrorMessage(overviewQuery.error, 'Unable to load dashboard metrics.')
    : null;

  return {
    summary: data?.summary ?? null,
    summaryLoading: overviewQuery.isPending,
    summaryRefreshing: overviewQuery.isFetching,
    summaryError: sharedError,
    retrySummary: retry,

    trackProgress: {
      data: data?.trackProgress ?? null,
      loading: overviewQuery.isPending,
      retrying: overviewQuery.isFetching,
      error: sharedError,
      onRetry: retry,
    },

    statusBreakdown: {
      data: data?.statusBreakdown ?? null,
      loading: overviewQuery.isPending,
      retrying: overviewQuery.isFetching,
      error: sharedError,
      onRetry: retry,
    },

    employeeStatus: {
      data: data?.employeeStatus ?? null,
      loading: overviewQuery.isPending,
      retrying: overviewQuery.isFetching,
      error: sharedError,
      onRetry: retry,
    },

    activityTrend: {
      data: data?.activityTrend ?? null,
      loading: overviewQuery.isPending,
      retrying: overviewQuery.isFetching,
      error: sharedError,
      onRetry: retry,
    },

    refreshing: overviewQuery.isFetching,
    handleRefresh,
  };
}
