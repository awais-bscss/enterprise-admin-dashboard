import { useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../components/toast/toastContext';
import { getErrorMessage } from '../lib/errors';
import { invalidateWorkspaceQueries, queryKeys } from '../lib/queryKeys';
import { usersService } from '../services/apiService';
import type { PaginationMeta } from '../types/api';
import type { DirectoryPreviewUser, Role, UsersDirectoryStats } from '../types/auth';
import {
  readPositiveIntParam,
  readStringParam,
  useUrlQueryUpdater,
} from './useUrlQueryState';
import { useActiveDepartments } from './useWorkspaceOptions';

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
  const departmentFilter = readStringParam(searchParams, 'departmentId');
  const page = readPositiveIntParam(searchParams, 'page', QUERY_DEFAULTS.page);
  const limit = readPositiveIntParam(
    searchParams,
    'limit',
    QUERY_DEFAULTS.limit,
    ALLOWED_LIMITS,
  );

  const departments = useActiveDepartments();

  const query = useQuery({
    queryKey: queryKeys.users.list({
      q: search,
      role: roleFilter,
      status: statusFilter,
      departmentId: departmentFilter,
      page,
      limit,
    }),
    queryFn: ({ signal }) =>
      usersService.list({
        q: search,
        role: roleFilter,
        status: statusFilter,
        departmentId: departmentFilter,
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
    onSuccess: (updated) => {
      void invalidateWorkspaceQueries(queryClient, ['users', 'dashboard', 'audit']);
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
    onSuccess: (updated) => {
      void invalidateWorkspaceQueries(queryClient, ['users', 'dashboard', 'audit']);
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
    onSuccess: (_deletedId, member) => {
      if (users.length <= 1 && page > 1) {
        updateParams({ page: page - 1 });
      }
      void invalidateWorkspaceQueries(queryClient, [
        'users',
        'dashboard',
        'departments',
        'projects',
        'audit',
      ]);
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

  return {
    users,
    departments,
    stats,
    pagination,
    search,
    setSearch: (value: string) => updateParams({ q: value, page: 1 }),
    roleFilter,
    setRoleFilter: (value: string) => updateParams({ role: value, page: 1 }),
    statusFilter,
    setStatusFilter: (value: string) => updateParams({ status: value, page: 1 }),
    departmentFilter,
    setDepartmentFilter: (value: string) => updateParams({ departmentId: value, page: 1 }),
    setPage: (nextPage: number) => updateParams({ page: nextPage }),
    setLimit: (value: number) => updateParams({ limit: value, page: 1 }),
    loaded: !query.isPending,
    isFetching: query.isFetching,
    error:
      actionError ??
      (query.error ? getErrorMessage(query.error, 'Unable to load directory.') : null),
    busyId,
    reloadDirectory: () =>
      invalidateWorkspaceQueries(queryClient, [
        'users',
        'dashboard',
        'departments',
        'projects',
        'audit',
      ]),
    handleRoleChange: (member: DirectoryPreviewUser, role: Role) =>
      roleMutation.mutateAsync({ member, role }).catch(() => undefined),
    handleStatusToggle: (member: DirectoryPreviewUser) =>
      statusMutation.mutateAsync(member).catch(() => undefined),
    handleDeleteUser: (member: DirectoryPreviewUser) =>
      deleteMutation.mutateAsync(member).catch(() => undefined),
  };
}
