import { useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../components/toast/toastContext';
import { getErrorMessage } from '../lib/errors';
import { invalidateWorkspaceQueries, queryKeys } from '../lib/queryKeys';
import { projectsService } from '../services/apiService';
import type { PaginationMeta } from '../types/api';
import type { ProjectItem, ProjectsWorkspaceStats } from '../types/auth';
import {
  readPositiveIntParam,
  readStringParam,
  useUrlQueryUpdater,
} from './useUrlQueryState';
import { useActiveClients, useActiveDepartments, useActiveEmployees } from './useWorkspaceOptions';

const EMPTY_STATS: ProjectsWorkspaceStats = {
  total: 0,
  completed: 0,
  inProgress: 0,
  upcoming: 0,
};

const QUERY_DEFAULTS = { page: 1, limit: 8 } as const;
const ALLOWED_LIMITS = [8, 15, 25] as const;

export function useProjectsWorkspace() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { searchParams, updateParams } = useUrlQueryUpdater(QUERY_DEFAULTS);
  const [actionError, setActionError] = useState<string | null>(null);

  const search = readStringParam(searchParams, 'q');
  const statusFilter = readStringParam(searchParams, 'status');
  const departmentFilter = readStringParam(searchParams, 'departmentId');
  const clientFilter = readStringParam(searchParams, 'clientId');
  const ownerFilter = readStringParam(searchParams, 'ownerId');
  const sort = readStringParam(searchParams, 'sort');
  const page = readPositiveIntParam(searchParams, 'page', QUERY_DEFAULTS.page);
  const limit = readPositiveIntParam(
    searchParams,
    'limit',
    QUERY_DEFAULTS.limit,
    ALLOWED_LIMITS,
  );

  const departments = useActiveDepartments();
  const clients = useActiveClients();
  const employees = useActiveEmployees();

  const query = useQuery({
    queryKey: queryKeys.projects.list({
      q: search,
      departmentId: departmentFilter,
      ...(clientFilter ? { clientId: clientFilter } : {}),
      ownerId: ownerFilter,
      status: statusFilter,
      ...(sort ? { sort } : {}),
      page,
      limit,
    }),
    queryFn: ({ signal }) =>
      projectsService.list({
        q: search,
        departmentId: departmentFilter,
        ...(clientFilter ? { clientId: clientFilter } : {}),
        ownerId: ownerFilter,
        status: statusFilter,
        ...(sort ? { sort } : {}),
        page,
        limit,
        signal,
      }),
    placeholderData: keepPreviousData,
  });

  const projects = query.data?.projects ?? [];
  const stats = query.data?.stats ?? EMPTY_STATS;
  const pagination: PaginationMeta = query.data?.pagination ?? {
    page,
    limit,
    total: 0,
    totalPages: 1,
  };

  const deleteMutation = useMutation({
    mutationFn: (project: ProjectItem) => projectsService.remove(project.id),
    onMutate: () => setActionError(null),
    onSuccess: (_deletedId, project) => {
      if (projects.length <= 1 && page > 1) {
        updateParams({ page: page - 1 });
      }
      void invalidateWorkspaceQueries(queryClient, [
        'projects',
        'dashboard',
        'departments',
        'clients',
        'users',
        'audit',
      ]);
      toast.success(`Deleted "${project.name}".`);
    },
    onError: (err: unknown) => {
      const message = getErrorMessage(err, 'Failed to delete project.');
      setActionError(message);
      toast.error(message);
    },
  });

  const busyId = deleteMutation.isPending ? deleteMutation.variables.id : null;

  return {
    projects,
    departments,
    clients,
    employees,
    stats,
    pagination,
    loaded: !query.isPending,
    isFetching: query.isFetching,
    error:
      actionError ??
      (query.error ? getErrorMessage(query.error, 'Unable to load projects.') : null),
    search,
    setSearch: (value: string) => updateParams({ q: value, page: 1 }),
    statusFilter,
    setStatusFilter: (value: string) => updateParams({ status: value, page: 1 }),
    departmentFilter,
    setDepartmentFilter: (value: string) => updateParams({ departmentId: value, page: 1 }),
    clientFilter,
    setClientFilter: (value: string) => updateParams({ clientId: value, page: 1 }),
    ownerFilter,
    setOwnerFilter: (value: string) => updateParams({ ownerId: value, page: 1 }),
    sort,
    setSort: (value: string) => updateParams({ sort: value === 'recent' ? '' : value, page: 1 }),
    setPage: (nextPage: number) => updateParams({ page: nextPage }),
    setLimit: (value: number) => updateParams({ limit: value, page: 1 }),
    busyId,
    reloadProjects: () =>
      invalidateWorkspaceQueries(queryClient, [
        'projects',
        'dashboard',
        'departments',
        'clients',
        'users',
        'audit',
      ]),
    handleDelete: (project: ProjectItem) => deleteMutation.mutateAsync(project).catch(() => undefined),
  };
}
