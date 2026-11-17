import { useCallback, useMemo, useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useToast } from '../components/toast/toastContext';
import { getErrorMessage } from '../lib/errors';
import { triggerBlobDownload } from '../lib/formatters';
import { queryKeys } from '../lib/queryKeys';
import {
  readPositiveIntParam,
  readStringParam,
  useUrlQueryUpdater,
} from './useUrlQueryState';
import { buildCsvInWorker } from '../lib/workerClient';
import { workspaceService } from '../services/apiService';
import type { PaginationMeta } from '../types/api';

const QUERY_DEFAULTS = { page: 1, limit: 12 } as const;
const ALLOWED_LIMITS = [12, 25, 50] as const;

export function useAuditLogs() {
  const toast = useToast();
  const { searchParams, updateParams } = useUrlQueryUpdater(QUERY_DEFAULTS);
  const [exportingCsv, setExportingCsv] = useState(false);

  const resourceFilter = readStringParam(searchParams, 'resourceType');
  const page = readPositiveIntParam(searchParams, 'page', QUERY_DEFAULTS.page);
  const limit = readPositiveIntParam(
    searchParams,
    'limit',
    QUERY_DEFAULTS.limit,
    ALLOWED_LIMITS,
  );

  const query = useQuery({
    queryKey: queryKeys.audit.list({ resourceType: resourceFilter, page, limit }),
    queryFn: ({ signal }) =>
      workspaceService.listAuditLogs({
        resourceType: resourceFilter,
        page,
        limit,
        signal,
      }),
    placeholderData: keepPreviousData,
  });

  const logs = useMemo(() => query.data?.logs ?? [], [query.data?.logs]);
  const pagination: PaginationMeta = query.data?.pagination ?? {
    page,
    limit,
    total: 0,
    totalPages: 1,
  };

  function setResourceFilter(value: string) {
    updateParams({ resourceType: value, page: 1 });
  }

  function setPage(nextPage: number) {
    updateParams({ page: nextPage });
  }

  function setLimit(value: number) {
    updateParams({ limit: value, page: 1 });
  }

  const handleRefresh = useCallback(async () => {
    const result = await query.refetch();
    if (result.error) {
      toast.error(getErrorMessage(result.error, 'Unable to refresh audit logs.'));
      return;
    }
    toast.info('Audit log feed refreshed.');
  }, [query, toast]);

  const handleExportVisibleCsv = useCallback(async () => {
    if (logs.length === 0) return;
    setExportingCsv(true);
    try {
      const headers = ['Action', 'Resource', 'Summary', 'Actor', 'Role', 'Timestamp'];
      const rows = logs.map((entry) => [
        entry.action,
        entry.resourceType,
        entry.summary,
        entry.actorName,
        entry.actorRole,
        new Date(entry.createdAt).toISOString(),
      ]);
      const blob = await buildCsvInWorker(headers, rows);
      triggerBlobDownload(blob, `audit-logs-page-${page}.csv`);
      toast.success(`Exported ${logs.length} audit events via background worker.`);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Unable to export audit log CSV.'));
    } finally {
      setExportingCsv(false);
    }
  }, [logs, page, toast]);

  return {
    logs,
    pagination,
    resourceFilter,
    setResourceFilter,
    setPage,
    setLimit,
    loaded: !query.isPending,
    refreshing: query.isFetching,
    exportingCsv,
    error: query.error ? getErrorMessage(query.error, 'Unable to load audit logs.') : null,
    handleRefresh,
    handleExportVisibleCsv,
  };
}
