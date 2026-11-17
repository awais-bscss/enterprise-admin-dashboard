export const loadDashboardPage = () =>
  import('../features/dashboard/DashboardPage').then((mod) => ({ default: mod.DashboardPage }));

export const loadProjectsPage = () =>
  import('../features/projects/ProjectsPage').then((mod) => ({ default: mod.ProjectsPage }));

export const loadDirectoryPage = () =>
  import('../features/directory/DirectoryPage').then((mod) => ({ default: mod.DirectoryPage }));

export const loadAuditLogsPage = () =>
  import('../features/workspace/AuditLogsPage').then((mod) => ({ default: mod.AuditLogsPage }));

export const loadReportsPage = () =>
  import('../features/workspace/ReportsPage').then((mod) => ({ default: mod.ReportsPage }));

export const loadSettingsPage = () =>
  import('../features/workspace/SettingsPage').then((mod) => ({ default: mod.SettingsPage }));

const PRELOAD_MAP: Record<string, () => Promise<unknown>> = {
  '/dashboard': loadDashboardPage,
  '/projects': loadProjectsPage,
  '/users': loadDirectoryPage,
  '/directory': loadDirectoryPage,
  '/audit': loadAuditLogsPage,
  '/reports': loadReportsPage,
  '/settings': loadSettingsPage,
};

export function preloadRoute(pathname: string): void {
  const loader = PRELOAD_MAP[pathname];
  if (loader) {
    void loader();
  }
}
