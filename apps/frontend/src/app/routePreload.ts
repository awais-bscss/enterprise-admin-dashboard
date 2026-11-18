export const loadDashboardPage = () =>
  import('../features/dashboard/DashboardPage').then((mod) => ({ default: mod.DashboardPage }));

export const loadDashboardChartsGrid = () =>
  import('../features/dashboard/components/DashboardChartsGrid').then((mod) => ({
    default: mod.DashboardChartsGrid,
  }));

export const loadProjectsPage = () =>
  import('../features/projects/ProjectsPage').then((mod) => ({ default: mod.ProjectsPage }));

export const loadDepartmentsPage = () =>
  import('../features/departments/DepartmentsPage').then((mod) => ({
    default: mod.DepartmentsPage,
  }));

export const loadClientsPage = () =>
  import('../features/clients/ClientsPage').then((mod) => ({ default: mod.ClientsPage }));

export const loadDirectoryPage = () =>
  import('../features/directory/DirectoryPage').then((mod) => ({ default: mod.DirectoryPage }));

export const loadAuditLogsPage = () =>
  import('../features/workspace/AuditLogsPage').then((mod) => ({ default: mod.AuditLogsPage }));

export const loadReportsPage = () =>
  import('../features/workspace/ReportsPage').then((mod) => ({ default: mod.ReportsPage }));

const loadDashboardEntry = () => Promise.all([loadDashboardPage(), loadDashboardChartsGrid()]);

const PRELOAD_MAP: Record<string, () => Promise<unknown>> = {
  '/': loadDashboardEntry,
  '/dashboard': loadDashboardEntry,
  '/projects': loadProjectsPage,
  '/departments': loadDepartmentsPage,
  '/clients': loadClientsPage,
  '/employees': loadDirectoryPage,
  '/users': loadDirectoryPage,
  '/directory': loadDirectoryPage,
  '/audit': loadAuditLogsPage,
  '/reports': loadReportsPage,
};

export function preloadRoute(pathname: string): void {
  const loader = PRELOAD_MAP[pathname];
  if (loader) {
    void loader();
  }
}
