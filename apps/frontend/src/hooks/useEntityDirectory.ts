import { useState } from 'react';
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryKey,
} from '@tanstack/react-query';
import { useToast } from '../components/toast/toastContext';
import { getErrorMessage } from '../lib/errors';
import { invalidateWorkspaceQueries, type WorkspaceQueryScope } from '../lib/queryKeys';
import {
  readPositiveIntParam,
  readStringParam,
  useUrlQueryUpdater,
} from './useUrlQueryState';
import type { EntityFilters } from '../services/apiService';
import type { PaginationMeta } from '../types/api';
import type { EntityStatus, EntityStatusStats } from '../types/auth';

const EMPTY_STATS: EntityStatusStats = { total: 0, active: 0, inactive: 0 };
const QUERY_DEFAULTS = { page: 1, limit: 10 } as const;
const ALLOWED_LIMITS = [10, 20, 50] as const;

interface EntityDirectoryConfig<
  TItem extends { id: string; name: string; status: EntityStatus },
  TResponse extends { stats: EntityStatusStats; pagination: PaginationMeta },
> {
  scope: Extract<WorkspaceQueryScope, 'departments' | 'clients'>;
  noun: string;
  getQueryKey: (params: { q: string; status: string; page: number; limit: number }) => QueryKey;
  listFn: (params: EntityFilters) => Promise<TResponse>;
  extractItems: (res: TResponse) => TItem[];
  updateStatusFn: (id: string, status: EntityStatus) => Promise<TItem>;
  removeFn: (id: string) => Promise<string>;
}

// Shared state and query hook for paginated directory workspaces.
export function useEntityDirectory<
  TItem extends { id: string; name: string; status: EntityStatus },
  TResponse extends { stats: EntityStatusStats; pagination: PaginationMeta },
>(config: EntityDirectoryConfig<TItem, TResponse>) {
  const { scope, noun, getQueryKey, listFn, extractItems, updateStatusFn, removeFn } = config;
  const queryClient = useQueryClient();
  const toast = useToast();
  const { searchParams, updateParams } = useUrlQueryUpdater(QUERY_DEFAULTS);
  const [actionError, setActionError] = useState<string | null>(null);

  const search = readStringParam(searchParams, 'q');
  const statusFilter = readStringParam(searchParams, 'status');
  const page = readPositiveIntParam(searchParams, 'page', QUERY_DEFAULTS.page);
  const limit = readPositiveIntParam(
    searchParams,
    'limit',
    QUERY_DEFAULTS.limit,
    ALLOWED_LIMITS,
  );

  const query = useQuery({
    queryKey: getQueryKey({ q: search, status: statusFilter, page, limit }),
    queryFn: ({ signal }) => listFn({ q: search, status: statusFilter, page, limit, signal }),
    placeholderData: keepPreviousData,
  });

  const items = query.data ? extractItems(query.data) : [];
  const stats = query.data?.stats ?? EMPTY_STATS;
  const pagination: PaginationMeta = query.data?.pagination ?? {
    page,
    limit,
    total: 0,
    totalPages: 1,
  };

  const statusMutation = useMutation({
    mutationFn: (item: TItem) =>
      updateStatusFn(item.id, item.status === 'active' ? 'inactive' : 'active'),
    onMutate: () => setActionError(null),
    onSuccess: (updated) => {
      void invalidateWorkspaceQueries(queryClient, [scope, 'projects', 'users', 'dashboard', 'audit']);
      toast.success(
        updated.status === 'active' ? `Activated ${updated.name}.` : `Deactivated ${updated.name}.`,
      );
    },
    onError: (err: unknown) => {
      const message = getErrorMessage(err, `Unable to update ${noun} status.`);
      setActionError(message);
      toast.error(message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (item: TItem) => removeFn(item.id),
    onMutate: () => setActionError(null),
    onSuccess: (_deletedId, item) => {
      if (items.length <= 1 && page > 1) {
        updateParams({ page: page - 1 });
      }
      void invalidateWorkspaceQueries(queryClient, [scope, 'projects', 'users', 'dashboard', 'audit']);
      toast.success(`Removed ${noun} "${item.name}".`);
    },
    onError: (err: unknown) => {
      const message = getErrorMessage(err, `Unable to delete ${noun}.`);
      setActionError(message);
      toast.error(message);
    },
  });

  const busyId = statusMutation.isPending
    ? statusMutation.variables.id
    : deleteMutation.isPending
      ? deleteMutation.variables.id
      : null;

  return {
    items,
    stats,
    pagination,
    search,
    setSearch: (value: string) => updateParams({ q: value, page: 1 }),
    statusFilter,
    setStatusFilter: (value: string) => updateParams({ status: value, page: 1 }),
    setPage: (nextPage: number) => updateParams({ page: nextPage }),
    setLimit: (value: number) => updateParams({ limit: value, page: 1 }),
    loaded: !query.isPending,
    isFetching: query.isFetching,
    error:
      actionError ??
      (query.error ? getErrorMessage(query.error, `Unable to load ${noun}s.`) : null),
    busyId,
    reload: () => invalidateWorkspaceQueries(queryClient, [scope, 'audit']),
    handleStatusToggle: (item: TItem) => statusMutation.mutateAsync(item).catch(() => undefined),
    handleDelete: (item: TItem) => deleteMutation.mutateAsync(item).catch(() => undefined),
  };
}
