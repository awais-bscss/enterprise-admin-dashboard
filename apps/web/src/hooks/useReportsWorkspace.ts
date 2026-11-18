import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../components/toast/toastContext';
import { getErrorMessage } from '../lib/errors';
import { triggerBlobDownload } from '../lib/formatters';
import { invalidateWorkspaceQueries, queryKeys } from '../lib/queryKeys';
import { formatJsonReportInWorker } from '../lib/workerClient';
import { dashboardService, workspaceService } from '../services/apiService';

export function useReportsWorkspace() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [exporting, setExporting] = useState<'csv' | 'json' | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const overviewQuery = useQuery({
    queryKey: queryKeys.dashboard.summary,
    queryFn: ({ signal }) => dashboardService.getSummary(signal),
  });

  async function handleExportCsv() {
    setExporting('csv');
    setActionError(null);
    try {
      const blob = await workspaceService.exportCsvReportBlob();
      triggerBlobDownload(blob, 'enterprise-compliance-report.csv');
      await invalidateWorkspaceQueries(queryClient, ['audit']);
      toast.success('CSV compliance report downloaded.');
    } catch (err) {
      const message = getErrorMessage(err, 'Unable to export CSV report.');
      setActionError(message);
      toast.error(message);
    } finally {
      setExporting(null);
    }
  }

  async function handleExportJson() {
    setExporting('json');
    setActionError(null);
    try {
      const payload = await workspaceService.exportJsonReport();
      const blob = await formatJsonReportInWorker(payload);
      triggerBlobDownload(blob, 'enterprise-compliance-report.json');
      await invalidateWorkspaceQueries(queryClient, ['audit']);
      toast.success('JSON compliance report formatted and downloaded.');
    } catch (err) {
      const message = getErrorMessage(err, 'Unable to export JSON report.');
      setActionError(message);
      toast.error(message);
    } finally {
      setExporting(null);
    }
  }

  async function handleRetry() {
    setActionError(null);
    await overviewQuery.refetch();
  }

  return {
    overview: overviewQuery.data ?? null,
    exporting,
    retrying: overviewQuery.isFetching,
    error:
      actionError ??
      (overviewQuery.error
        ? getErrorMessage(overviewQuery.error, 'Unable to load report metrics.')
        : null),
    handleExportCsv,
    handleExportJson,
    handleRetry,
  };
}
