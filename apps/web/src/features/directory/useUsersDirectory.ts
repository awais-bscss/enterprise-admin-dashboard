import { useCallback, useEffect, useState } from 'react';
import { getErrorMessage, isAbortError } from '../../lib/errors';
import type { DirectoryPreviewUser, Role, UsersDirectoryStats } from '../../types/auth';
import { deleteUser, listUsers, updateUser } from './usersApi';

const EMPTY_STATS: UsersDirectoryStats = {
  total: 0,
  active: 0,
  suspended: 0,
  admins: 0,
  managers: 0,
  viewers: 0,
};

export function useUsersDirectory() {
  const [users, setUsers] = useState<DirectoryPreviewUser[]>([]);
  const [stats, setStats] = useState<UsersDirectoryStats>(EMPTY_STATS);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const reloadDirectory = useCallback(async () => {
    try {
      const data = await listUsers({ q: search, role: roleFilter, status: statusFilter });
      setUsers(data.users);
      setStats(data.stats);
      setError(null);
      setLoaded(true);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Unable to load directory.'));
      setLoaded(true);
    }
  }, [search, roleFilter, statusFilter]);

  useEffect(() => {
    const controller = new AbortController();
    listUsers({ q: search, role: roleFilter, status: statusFilter, signal: controller.signal })
      .then((data) => {
        setUsers(data.users);
        setStats(data.stats);
        setError(null);
        setLoaded(true);
      })
      .catch((err: unknown) => {
        if (isAbortError(err)) return;
        setError(getErrorMessage(err, 'Unable to load directory.'));
        setLoaded(true);
      });

    return () => controller.abort();
  }, [search, roleFilter, statusFilter]);

  async function handleRoleChange(member: DirectoryPreviewUser, role: Role) {
    setBusyId(member.id);
    setError(null);
    try {
      await updateUser(member.id, { role });
      await reloadDirectory();
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Unable to update role.'));
    } finally {
      setBusyId(null);
    }
  }

  async function handleStatusToggle(member: DirectoryPreviewUser) {
    const nextStatus = member.status === 'active' ? 'suspended' : 'active';
    setBusyId(member.id);
    setError(null);
    try {
      await updateUser(member.id, { status: nextStatus });
      await reloadDirectory();
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Unable to update account status.'));
    } finally {
      setBusyId(null);
    }
  }

  async function handleDeleteUser(member: DirectoryPreviewUser) {
    setBusyId(member.id);
    setError(null);
    try {
      await deleteUser(member.id);
      setConfirmDeleteId(null);
      await reloadDirectory();
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Unable to delete user.'));
    } finally {
      setBusyId(null);
    }
  }

  return {
    users,
    stats,
    search,
    setSearch,
    roleFilter,
    setRoleFilter,
    statusFilter,
    setStatusFilter,
    loaded,
    error,
    busyId,
    confirmDeleteId,
    setConfirmDeleteId,
    reloadDirectory,
    handleRoleChange,
    handleStatusToggle,
    handleDeleteUser,
  };
}
