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
import { usersService } from '../services/apiService';
import type { PaginationMeta } from '../types/api';
import type { DirectoryPreviewUser, Role, UsersDirectoryStats } from '../types/auth';

const EMPTY_STATS: UsersDirectoryStats = {
  total: 0,
  active: 0,
  suspended: 0,
  admins: 0,
  managers: 0,
  viewers: 0,
};

const QUERY_DEFAULTS = { page: 1, limit: 10 } as const;
const ALLOWED_LIMITS = [10, 20, 50] as const;

export function useUsersDirectory() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { searchParams, updateParams } = useUrlQueryUpdater(QUERY_DEFAULTS);
  const [actionError, setActionError] = useState<string | null>(null);

  const search = readStringParam(searchParams, 'q');
  const roleFilter = readStringParam(searchParams, 'role');
  const statusFilter = readStringParam(searchParams, 'status');
  const page = readPositiveIntParam(searchParams, 'page', QUERY_DEFAULTS.page);
  const limit = readPositiveIntParam(
    searchParams,
    'limit',
    QUERY_DEFAULTS.limit,
    ALLOWED_LIMITS,
  );

  const query = useQuery({
    queryKey: queryKeys.users.list({
      q: search,
      role: roleFilter,
      status: statusFilter,
      page,
      limit,
    }),
    queryFn: ({ signal }) =>
      usersService.list({
        q: search,
        role: roleFilter,
        status: statusFilter,
        page,
        limit,
        signal,
      }),
    placeholderData: keepPreviousData,
  });

  const users = query.data?.users ?? [];
  const stats = query.data?.stats ?? EMPTY_STATS;
  const pagination: PaginationMeta = query.data?.pagination ?? {
    page,
    limit,
    total: 0,
    totalPages: 1,
  };

  const roleMutation = useMutation({
    mutationFn: ({ member, role }: { member: DirectoryPreviewUser; role: Role }) =>
      usersService.update(member.id, { role }),
    onMutate: () => setActionError(null),
    onSuccess: async (updated) => {
      await invalidateWorkspaceQueries(queryClient, ['users', 'dashboard', 'audit']);
      toast.success(`Updated ${updated.name}'s role to ${updated.role}.`);
    },
    onError: (err: unknown) => {
      const message = getErrorMessage(err, 'Unable to update role.');
      setActionError(message);
      toast.error(message);
    },
  });

  const statusMutation = useMutation({
    mutationFn: (member: DirectoryPreviewUser) =>
      usersService.update(member.id, {
        status: member.status === 'active' ? 'suspended' : 'active',
      }),
    onMutate: () => setActionError(null),
    onSuccess: async (updated) => {
      await invalidateWorkspaceQueries(queryClient, ['users', 'dashboard', 'audit']);
      toast.success(
        updated.status === 'active'
          ? `Activated ${updated.name}.`
          : `Suspended ${updated.name}.`,
      );
    },
    onError: (err: unknown) => {
      const message = getErrorMessage(err, 'Unable to update account status.');
      setActionError(message);
      toast.error(message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (member: DirectoryPreviewUser) => usersService.remove(member.id),
    onMutate: () => setActionError(null),
    onSuccess: async (_deletedId, member) => {
      if (users.length <= 1 && page > 1) {
        updateParams({ page: page - 1 });
      }
      await invalidateWorkspaceQueries(queryClient, ['users', 'dashboard', 'projects', 'audit']);
      toast.success(`Removed user "${member.name}".`);
    },
    onError: (err: unknown) => {
      const message = getErrorMessage(err, 'Unable to delete user.');
      setActionError(message);
      toast.error(message);
    },
  });

  const busyId = roleMutation.isPending
    ? roleMutation.variables.member.id
    : statusMutation.isPending
      ? statusMutation.variables.id
      : deleteMutation.isPending
        ? deleteMutation.variables.id
        : null;

  function setSearch(value: string) {
    updateParams({ q: value, page: 1 });
  }

  function setRoleFilter(value: string) {
    updateParams({ role: value, page: 1 });
  }

  function setStatusFilter(value: string) {
    updateParams({ status: value, page: 1 });
  }

  function setPage(nextPage: number) {
    updateParams({ page: nextPage });
  }

  function setLimit(value: number) {
    updateParams({ limit: value, page: 1 });
  }

  async function handleRoleChange(member: DirectoryPreviewUser, role: Role) {
    await roleMutation.mutateAsync({ member, role }).catch(() => undefined);
  }

  async function handleStatusToggle(member: DirectoryPreviewUser) {
    await statusMutation.mutateAsync(member).catch(() => undefined);
  }

  async function handleDeleteUser(member: DirectoryPreviewUser) {
    await deleteMutation.mutateAsync(member).catch(() => undefined);
  }

  async function reloadDirectory() {
    await invalidateWorkspaceQueries(queryClient, ['users', 'dashboard', 'projects', 'audit']);
  }

  return {
    users,
    stats,
    pagination,
    search,
    setSearch,
    roleFilter,
    setRoleFilter,
    statusFilter,
    setStatusFilter,
    setPage,
    setLimit,
    loaded: !query.isPending,
    isFetching: query.isFetching,
    error:
      actionError ??
      (query.error ? getErrorMessage(query.error, 'Unable to load directory.') : null),
    busyId,
    reloadDirectory,
    handleRoleChange,
    handleStatusToggle,
    handleDeleteUser,
  };
}
