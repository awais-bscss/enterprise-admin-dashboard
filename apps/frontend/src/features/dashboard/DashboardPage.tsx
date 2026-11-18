import { lazy, Suspense, useState } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Building2, FolderKanban, Plus, RefreshCw, Users } from 'lucide-react';
import { loadDashboardChartsGrid } from '../../app/routePreload';
import { ErrorAlertBanner } from '../../components/ErrorAlertBanner';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import {
  DashboardChartsSkeleton,
  DeadlineAlertsSkeleton,
} from '../../components/WorkspaceSkeletons';
import { getInitials } from '../../lib/formatters';
import { BADGE_TOKENS, BUTTON_TOKENS } from '../../theme/tokens';
import { useAuth } from '../auth/authContext';
import { PermissionGate } from '../auth/PermissionGate';
import { DeadlineAlertsSection } from './components/DeadlineAlertsSection';
import { StatBentoCard } from './components/StatBentoCard';
import { useDashboardOverview } from '../../hooks/useDashboardOverview';

const DashboardChartsGrid = lazy(loadDashboardChartsGrid);
const ProjectFormModal = lazy(() =>
  import('../projects/ProjectFormModal').then((mod) => ({
    default: mod.ProjectFormModal,
  })),
);
const UserFormModal = lazy(() =>
  import('../directory/UserFormModal').then((mod) => ({
    default: mod.UserFormModal,
  })),
);

const KPI_PILL_CLASS =
  'rounded-full border border-slate-200/80 bg-surface-subtle px-2.5 py-0.5 text-[11px] font-medium text-slate-600 dark:border-slate-700 dark:text-slate-300';

export function DashboardPage() {
  const { user } = useAuth();
  const {
    summary,
    summaryLoading,
    summaryRefreshing,
    summaryError,
    retrySummary,
    trackProgress,
    statusBreakdown,
    employeeStatus,
    activityTrend,
    refreshing,
    handleRefresh,
  } = useDashboardOverview();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [userModalOpen, setUserModalOpen] = useState(false);

  const totalProjects = summary?.stats.totalProjects ?? 0;
  const activeProjects = summary?.stats.activeProjects ?? 0;
  const completedProjects = summary?.stats.completedProjects ?? 0;
  const averageProgress = summary?.stats.averageProgress ?? 0;
  const totalDepartments = summary?.stats.totalDepartments ?? 0;
  const activeDepartments = summary?.stats.activeDepartments ?? 0;
  const totalClients = summary?.stats.totalClients ?? 0;
  const activeClients = summary?.stats.activeClients ?? 0;
  const totalUsers = summary?.stats.totalUsers ?? 0;
  const activeUsers = summary?.stats.activeUsers ?? 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-[28px] dark:text-slate-100">
              Project &amp; Administration Overview
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Welcome back,{' '}
              <span className="font-semibold text-slate-700 dark:text-slate-200">{user?.name}</span>{' '}
              &middot; Live project metrics, departments, clients, and team status
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => void handleRefresh()}
              disabled={refreshing}
              className={`${BUTTON_TOKENS.secondaryPill} py-2.5`}
            >
              <RefreshCw
                className={`h-3.5 w-3.5 text-slate-500 dark:text-slate-400 ${refreshing ? 'animate-spin' : ''}`}
              />
              Refresh
            </button>

            <PermissionGate permission="projects:write">
              <button
                type="button"
                onClick={() => setCreateModalOpen(true)}
                className={`${BUTTON_TOKENS.primarySoftPill} py-2.5`}
              >
                <Plus className="h-3.5 w-3.5" />
                New Project
              </button>
            </PermissionGate>
          </div>
        </div>

        {summaryError ? (
          <ErrorAlertBanner
            message={summaryError}
            onRetry={retrySummary}
            retrying={summaryRefreshing}
          />
        ) : null}

        <ErrorBoundary
          variant="section"
          sectionTitle="Workspace KPI summary"
          onReset={retrySummary}
        >
          <section
            className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4"
            aria-label="Workspace key metrics"
          >
            <StatBentoCard
              title="Projects"
              value={summary ? totalProjects : '--'}
              delta={summary ? `${activeProjects} active` : 'Unavailable'}
              footerLabel={
                summary ? `${averageProgress}% avg · ${completedProjects} done` : 'Project progress'
              }
              to="/projects"
              tone="mint"
              icon={FolderKanban}
              loading={summaryLoading && !summary}
              rightSlot={<span className={KPI_PILL_CLASS}>Workspace</span>}
            />

            <StatBentoCard
              title="Departments"
              value={summary ? totalDepartments : '--'}
              delta={summary ? `${activeDepartments} active` : 'Unavailable'}
              footerLabel="Functional teams"
              to="/departments"
              tone="sky"
              icon={Building2}
              loading={summaryLoading && !summary}
              rightSlot={<span className={KPI_PILL_CLASS}>Teams</span>}
            />

            <StatBentoCard
              title="Clients"
              value={summary ? totalClients : '--'}
              delta={summary ? `${activeClients} active` : 'Unavailable'}
              footerLabel="Managed client accounts"
              to="/clients"
              tone="violet"
              icon={Briefcase}
              loading={summaryLoading && !summary}
              rightSlot={<span className={KPI_PILL_CLASS}>Accounts</span>}
            />

            <StatBentoCard
              title="Employees"
              value={summary ? totalUsers : '--'}
              delta={summary ? `${activeUsers} active` : 'Unavailable'}
              footerLabel={
                summary
                  ? summary.stats.activeSessions === null
                    ? 'Workspace directory'
                    : `${summary.stats.activeSessions} live sessions`
                  : 'Workspace directory'
              }
              to="/employees"
              tone="rose"
              icon={Users}
              loading={summaryLoading && !summary}
              rightSlot={
                <div className="flex items-center -space-x-2">
                  {(summary?.directoryPreview ?? []).slice(0, 3).map((member, idx) => (
                    <span
                      key={member.id}
                      title={`${member.name} (${member.role})`}
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold ring-2 ring-white dark:ring-slate-900 ${
                        BADGE_TOKENS.avatarTones[idx % BADGE_TOKENS.avatarTones.length]
                      }`}
                    >
                      {getInitials(member.name)}
                    </span>
                  ))}
                  <PermissionGate
                    permission="users:write"
                    fallback={
                      <Link
                        to="/employees"
                        aria-label="View employees"
                        className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-surface-subtle text-slate-500 ring-2 ring-white hover:bg-sky-50 hover:text-sky-700 dark:border-slate-700 dark:text-slate-300 dark:ring-slate-900 dark:hover:bg-sky-500/20 dark:hover:text-sky-300"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </Link>
                    }
                  >
                    <button
                      type="button"
                      onClick={() => setUserModalOpen(true)}
                      aria-label="Add employee"
                      title="Add employee"
                      className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-surface-subtle text-slate-500 ring-2 ring-white hover:bg-sky-50 hover:text-sky-700 dark:border-slate-700 dark:text-slate-300 dark:ring-slate-900 dark:hover:bg-sky-500/20 dark:hover:text-sky-300"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </PermissionGate>
                </div>
              }
            />
          </section>
        </ErrorBoundary>

        <Suspense fallback={<DashboardChartsSkeleton />}>
          <DashboardChartsGrid
            trackProgress={trackProgress}
            statusBreakdown={statusBreakdown}
            employeeStatus={employeeStatus}
            activityTrend={activityTrend}
          />
        </Suspense>

        {summaryLoading && !summary ? (
          <DeadlineAlertsSkeleton />
        ) : summary ? (
          <DeadlineAlertsSection alerts={summary.deadlineAlerts} />
        ) : null}
      </div>

      {createModalOpen ? (
        <Suspense fallback={null}>
          <ProjectFormModal
            onClose={() => setCreateModalOpen(false)}
            onSaved={() => {
              setCreateModalOpen(false);
            }}
          />
        </Suspense>
      ) : null}

      {userModalOpen ? (
        <Suspense fallback={null}>
          <UserFormModal
            currentUserId={user?.id}
            onClose={() => setUserModalOpen(false)}
            onSaved={() => {
              setUserModalOpen(false);
            }}
          />
        </Suspense>
      ) : null}
    </DashboardLayout>
  );
}
