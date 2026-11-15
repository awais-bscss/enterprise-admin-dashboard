import { useCallback, useEffect, useMemo, useState } from 'react';
import { getErrorMessage, isAbortError } from '../../lib/errors';
import type { DashboardOverviewData, Permission } from '../../types/auth';
import { getDashboardOverview } from './dashboardApi';

export interface ModuleCardConfig {
  permission: Permission;
  title: string;
  grantedText: string;
  deniedText: string;
  to: string;
}

export const RBAC_MODULES: readonly ModuleCardConfig[] = [
  {
    permission: 'projects:write',
    title: 'Project Delivery',
    grantedText: 'Create initiatives, update tasks, and manage milestone tracks.',
    deniedText: 'Requires projects:write permission (Admin or Manager).',
    to: '/projects',
  },
  {
    permission: 'users:write',
    title: 'User Administration',
    grantedText: 'Invite members, update role tiers, and manage account status.',
    deniedText: 'Requires users:write permission (Admin role).',
    to: '/users',
  },
  {
    permission: 'audit:read',
    title: 'Security Audit Logs',
    grantedText: 'Inspect live sign-ins, token sessions, and activity trails.',
    deniedText: 'Requires audit:read permission (Admin or Manager).',
    to: '/audit',
  },
  {
    permission: 'settings:manage',
    title: 'System Security Settings',
    grantedText: 'Configure authentication lifecycle and workspace policy.',
    deniedText: 'Requires settings:manage permission (Admin role).',
    to: '/settings',
  },
];

export function useDashboardOverview() {
  const [overview, setOverview] = useState<DashboardOverviewData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    getDashboardOverview(controller.signal)
      .then((data) => {
        setOverview(data);
        setError(null);
      })
      .catch((err: unknown) => {
        if (isAbortError(err)) return;
        setError(getErrorMessage(err, 'Unable to load overview'));
      });

    return () => controller.abort();
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const data = await getDashboardOverview();
      setOverview(data);
      setError(null);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Unable to load overview'));
    } finally {
      setRefreshing(false);
    }
  }, []);

  const filteredModules = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return RBAC_MODULES;
    return RBAC_MODULES.filter(
      (mod) =>
        mod.title.toLowerCase().includes(query) ||
        mod.permission.toLowerCase().includes(query) ||
        mod.grantedText.toLowerCase().includes(query),
    );
  }, [searchQuery]);

  const totalProjects = overview?.stats.totalProjects ?? 0;
  const activeProjects = overview?.stats.activeProjects ?? 0;
  const totalTasks = overview?.stats.totalTasks ?? 0;
  const completedTasks = overview?.stats.completedTasks ?? 0;
  const totalUsers = overview?.stats.totalUsers ?? 0;
  const taskRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return {
    overview,
    refreshing,
    error,
    searchQuery,
    setSearchQuery,
    filteredModules,
    metrics: {
      totalProjects,
      activeProjects,
      totalTasks,
      completedTasks,
      totalUsers,
      taskRate,
    },
    handleRefresh,
  };
}
