import { useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../components/toast/toastContext';
import { getErrorMessage } from '../lib/errors';
import { invalidateWorkspaceQueries, queryKeys } from '../lib/queryKeys';
import {
  readPositiveIntParam,
  readStringParam,
  useUrlQueryUpdater,
} from './useUrlQueryState';
import { projectsService } from '../services/apiService';
import type { PaginationMeta } from '../types/api';
import type { ProjectItem, ProjectStatus, ProjectsWorkspaceStats } from '../types/auth';

const EMPTY_STATS: ProjectsWorkspaceStats = {
  total: 0,
  completed: 0,
  inProgress: 0,
  upcoming: 0,
};

const QUERY_DEFAULTS = { page: 1, limit: 6 } as const;
const ALLOWED_LIMITS = [6, 9, 12] as const;

export function useProjectsWorkspace() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { searchParams, updateParams } = useUrlQueryUpdater(QUERY_DEFAULTS);
  const [actionError, setActionError] = useState<string | null>(null);

  const search = readStringParam(searchParams, 'q');
  const statusFilter = readStringParam(searchParams, 'status');
  const categoryFilter = readStringParam(searchParams, 'category');
  const page = readPositiveIntParam(searchParams, 'page', QUERY_DEFAULTS.page);
  const limit = readPositiveIntParam(
    searchParams,
    'limit',
    QUERY_DEFAULTS.limit,
    ALLOWED_LIMITS,
  );

  const query = useQuery({
    queryKey: queryKeys.projects.list({
      q: search,
      category: categoryFilter,
      status: statusFilter,
      page,
      limit,
    }),
    queryFn: ({ signal }) =>
      projectsService.list({
        q: search,
        category: categoryFilter,
        status: statusFilter,
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

  const quickCompleteMutation = useMutation({
    mutationFn: (project: ProjectItem) => {
      const nextDone = project.tasksCompleted + 1;
      const nextStatus: ProjectStatus =
        nextDone >= project.tasksTotal ? 'completed' : 'in_progress';
      return projectsService.update(project.id, {
        tasksCompleted: nextDone,
        status: nextStatus,
      });
    },
    onMutate: () => setActionError(null),
    onSuccess: (updated) => {
      void invalidateWorkspaceQueries(queryClient, ['projects', 'dashboard', 'audit']);
      toast.success(
        updated.status === 'completed'
          ? `"${updated.name}" marked completed.`
          : `Logged +1 task for "${updated.name}".`,
      );
    },
    onError: (err: unknown) => {
      const message = getErrorMessage(err, 'Failed to update task count.');
      setActionError(message);
      toast.error(message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (project: ProjectItem) => projectsService.remove(project.id),
    onMutate: () => setActionError(null),
    onSuccess: (_deletedId, project) => {
      if (projects.length <= 1 && page > 1) {
        updateParams({ page: page - 1 });
      }
      void invalidateWorkspaceQueries(queryClient, ['projects', 'dashboard', 'users', 'audit']);
      toast.success(`Deleted "${project.name}".`);
    },
    onError: (err: unknown) => {
      const message = getErrorMessage(err, 'Failed to delete project.');
      setActionError(message);
      toast.error(message);
    },
  });

  const busyId = quickCompleteMutation.isPending
    ? quickCompleteMutation.variables.id
    : deleteMutation.isPending
      ? deleteMutation.variables.id
      : null;

  function setSearch(value: string) {
    updateParams({ q: value, page: 1 });
  }

  function setStatusFilter(value: string) {
    updateParams({ status: value, page: 1 });
  }

  function setCategoryFilter(value: string) {
    updateParams({ category: value, page: 1 });
  }

  function setPage(nextPage: number) {
    updateParams({ page: nextPage });
  }

  function setLimit(value: number) {
    updateParams({ limit: value, page: 1 });
  }

  async function handleQuickCompleteTask(project: ProjectItem) {
    if (project.tasksCompleted >= project.tasksTotal) return;
    await quickCompleteMutation.mutateAsync(project).catch(() => undefined);
  }

  async function handleDelete(project: ProjectItem) {
    await deleteMutation.mutateAsync(project).catch(() => undefined);
  }

  async function reloadProjects() {
    await invalidateWorkspaceQueries(queryClient, ['projects', 'dashboard', 'users', 'audit']);
  }

  return {
    projects,
    stats,
    pagination,
    loaded: !query.isPending,
    isFetching: query.isFetching,
    error:
      actionError ??
      (query.error ? getErrorMessage(query.error, 'Unable to load projects.') : null),
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    categoryFilter,
    setCategoryFilter,
    setPage,
    setLimit,
    busyId,
    reloadProjects,
    handleQuickCompleteTask,
    handleDelete,
  };
}
