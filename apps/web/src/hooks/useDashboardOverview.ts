import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '../components/toast/toastContext';
import { getErrorMessage } from '../lib/errors';
import { queryKeys } from '../lib/queryKeys';
import { dashboardService } from '../services/apiService';

export function useDashboardOverview() {
  const toast = useToast();

  const summaryQuery = useQuery({
    queryKey: queryKeys.dashboard.summary,
    queryFn: ({ signal }) => dashboardService.getSummary(signal),
  });

  const trackProgressQuery = useQuery({
    queryKey: queryKeys.dashboard.trackProgress,
    queryFn: ({ signal }) => dashboardService.getTrackProgress(signal),
  });

  const statusBreakdownQuery = useQuery({
    queryKey: queryKeys.dashboard.statusBreakdown,
    queryFn: ({ signal }) => dashboardService.getStatusBreakdown(signal),
  });

  const employeeStatusQuery = useQuery({
    queryKey: queryKeys.dashboard.employeeStatus,
    queryFn: ({ signal }) => dashboardService.getEmployeeStatus(signal),
  });

  const activityTrendQuery = useQuery({
    queryKey: queryKeys.dashboard.activityTrend,
    queryFn: ({ signal }) => dashboardService.getActivityTrend(signal),
  });

  const refreshing =
    summaryQuery.isFetching ||
    trackProgressQuery.isFetching ||
    statusBreakdownQuery.isFetching ||
    employeeStatusQuery.isFetching ||
    activityTrendQuery.isFetching;

  const handleRefresh = useCallback(async () => {
    const results = await Promise.all([
      summaryQuery.refetch(),
      trackProgressQuery.refetch(),
      statusBreakdownQuery.refetch(),
      employeeStatusQuery.refetch(),
      activityTrendQuery.refetch(),
    ]);
    const failed = results.find((res) => res.error);
    if (failed?.error) {
      toast.error(getErrorMessage(failed.error, 'Some dashboard widgets failed to refresh.'));
      return;
    }
    toast.info('Dashboard metrics refreshed.');
  }, [
    activityTrendQuery,
    employeeStatusQuery,
    statusBreakdownQuery,
    summaryQuery,
    toast,
    trackProgressQuery,
  ]);

  const summary = summaryQuery.data ?? null;

  return {
    summary,
    summaryLoading: summaryQuery.isPending,
    summaryRefreshing: summaryQuery.isFetching,
    summaryError: summaryQuery.error
      ? getErrorMessage(summaryQuery.error, 'Unable to load workspace summary.')
      : null,
    retrySummary: () => {
      void summaryQuery.refetch();
    },

    trackProgress: {
      data: trackProgressQuery.data ?? null,
      loading: trackProgressQuery.isPending,
      retrying: trackProgressQuery.isFetching,
      error: trackProgressQuery.error
        ? getErrorMessage(trackProgressQuery.error, 'Unable to load track progress.')
        : null,
      onRetry: () => {
        void trackProgressQuery.refetch();
      },
    },

    statusBreakdown: {
      data: statusBreakdownQuery.data ?? null,
      loading: statusBreakdownQuery.isPending,
      retrying: statusBreakdownQuery.isFetching,
      error: statusBreakdownQuery.error
        ? getErrorMessage(statusBreakdownQuery.error, 'Unable to load project status.')
        : null,
      onRetry: () => {
        void statusBreakdownQuery.refetch();
      },
    },

    employeeStatus: {
      data: employeeStatusQuery.data ?? null,
      loading: employeeStatusQuery.isPending,
      retrying: employeeStatusQuery.isFetching,
      error: employeeStatusQuery.error
        ? getErrorMessage(employeeStatusQuery.error, 'Unable to load employee status.')
        : null,
      onRetry: () => {
        void employeeStatusQuery.refetch();
      },
    },

    activityTrend: {
      data: activityTrendQuery.data ?? null,
      loading: activityTrendQuery.isPending,
      retrying: activityTrendQuery.isFetching,
      error: activityTrendQuery.error
        ? getErrorMessage(activityTrendQuery.error, 'Unable to load activity trend.')
        : null,
      onRetry: () => {
        void activityTrendQuery.refetch();
      },
    },

    refreshing,
    handleRefresh,
  };
}
