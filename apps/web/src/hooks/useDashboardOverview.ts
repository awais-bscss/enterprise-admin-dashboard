import { useCallback, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '../components/toast/toastContext';
import { getErrorMessage } from '../lib/errors';
import { queryKeys } from '../lib/queryKeys';
import { dashboardService } from '../services/apiService';
import type { Permission } from '../types/auth';

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
  const toast = useToast();
  const [searchQuery, setSearchQuery] = useState('');

  const { data, error, isFetching, refetch } = useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: ({ signal }) => dashboardService.getOverview(signal),
  });

  const handleRefresh = useCallback(async () => {
    const result = await refetch();
    if (result.error) {
      toast.error(getErrorMessage(result.error, 'Unable to refresh overview.'));
      return;
    }
    toast.info('Dashboard metrics refreshed.');
  }, [refetch, toast]);

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

  const overview = data ?? null;
  const totalProjects = overview?.stats.totalProjects ?? 0;
  const activeProjects = overview?.stats.activeProjects ?? 0;
  const totalTasks = overview?.stats.totalTasks ?? 0;
  const completedTasks = overview?.stats.completedTasks ?? 0;
  const totalUsers = overview?.stats.totalUsers ?? 0;
  const taskRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return {
    overview,
    refreshing: isFetching,
    error: error ? getErrorMessage(error, 'Unable to load overview') : null,
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
