import { lazy, Suspense, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CheckSquare,
  FolderKanban,
  Lock,
  Plus,
  RefreshCw,
  Sparkles,
  Users,
} from 'lucide-react';
import { ErrorAlertBanner } from '../../components/ErrorAlertBanner';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { DashboardChartsSkeleton } from '../../components/WorkspaceSkeletons';
import { getInitials } from '../../lib/formatters';
import { BADGE_TOKENS, BUTTON_TOKENS, SURFACE_TOKENS } from '../../theme/tokens';
import { useAuth } from '../auth/authContext';
import { PermissionGate } from '../auth/PermissionGate';
import { StatBentoCard } from './components/StatBentoCard';
import { useDashboardOverview } from '../../hooks/useDashboardOverview';
import type {
  ActivityTrendPoint,
  CategoryProgressItem,
  ProjectStatusBreakdownItem,
} from '../../types/auth';

const DashboardChartsGrid = lazy(() =>
  import('./components/DashboardChartsGrid').then((mod) => ({
    default: mod.DashboardChartsGrid,
  })),
);
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

const EMPTY_CATEGORY_PROGRESS: readonly CategoryProgressItem[] = [];
const EMPTY_STATUS_BREAKDOWN: readonly ProjectStatusBreakdownItem[] = [];
const EMPTY_ACTIVITY_TREND: readonly ActivityTrendPoint[] = [];

export function DashboardPage() {
  const { user } = useAuth();
  const {
    overview,
    refreshing,
    error,
    searchQuery,
    setSearchQuery,
    filteredModules,
    metrics: { totalProjects, activeProjects, totalTasks, completedTasks, totalUsers, taskRate },
    handleRefresh,
  } = useDashboardOverview();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [userModalOpen, setUserModalOpen] = useState(false);

  return (
    <DashboardLayout searchQuery={searchQuery} onSearchChange={setSearchQuery}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-[28px] dark:text-slate-100">
              Project &amp; Administration Overview
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Welcome back,{' '}
              <span className="font-semibold text-slate-700 dark:text-slate-200">{user?.name}</span>{' '}
              &middot; Live project metrics, team capacity, and RBAC governance
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => void handleRefresh()}
              disabled={refreshing}
              className={`${BUTTON_TOKENS.secondaryPill} py-2.5`}
            >
              <RefreshCw className={`h-3.5 w-3.5 text-slate-500 dark:text-slate-400 ${refreshing ? 'animate-spin' : ''}`} />
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

        {error ? (
          <ErrorAlertBanner
            message={error}
            onRetry={() => void handleRefresh()}
            retrying={refreshing}
          />
        ) : null}

        <ErrorBoundary
          variant="section"
          sectionTitle="Workspace KPI summary"
          onReset={() => void handleRefresh()}
        >
          <section
            className="grid grid-cols-1 gap-5 md:grid-cols-3"
            aria-label="Workspace key metrics"
          >
            <StatBentoCard
              title="Active Projects"
              value={overview ? activeProjects : error ? '--' : '...'}
              delta={overview ? `${totalProjects} total` : error ? 'Unavailable' : '...'}
              footerLabel="Live project tracker"
              to="/projects"
              tone="mint"
              icon={FolderKanban}
              rightSlot={
                <span className="rounded-full border border-slate-200/80 bg-surface-subtle px-2.5 py-0.5 text-[11px] font-medium text-slate-600 dark:border-slate-700 dark:text-slate-300">
                  Workspace
                </span>
              }
            />

            <StatBentoCard
              title="Total Tasks"
              value={overview ? totalTasks : error ? '--' : '...'}
              delta={overview ? `${taskRate}% done` : error ? 'Unavailable' : '...'}
              footerLabel={`${completedTasks} completed tasks`}
              to="/projects"
              tone="sky"
              icon={CheckSquare}
              rightSlot={
                <span className="rounded-full border border-slate-200/80 bg-surface-subtle px-2.5 py-0.5 text-[11px] font-medium text-slate-600 dark:border-slate-700 dark:text-slate-300">
                  Milestones
                </span>
              }
            />

            <StatBentoCard
              title="Team Members"
              value={overview ? totalUsers : error ? '--' : '...'}
              delta={
                overview
                  ? overview.stats.activeSessions === null
                    ? 'Directory'
                    : `${overview.stats.activeSessions} sessions`
                  : error
                    ? 'Unavailable'
                    : '...'
              }
              footerLabel="Manage Users"
              to="/users"
              tone="rose"
              icon={Users}
              rightSlot={
                <div className="flex items-center -space-x-2">
                  {(overview?.directoryPreview ?? []).slice(0, 3).map((member, idx) => (
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
                        to="/users"
                        aria-label="View users"
                        className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-surface-subtle text-slate-500 ring-2 ring-white hover:bg-sky-50 hover:text-sky-700 dark:border-slate-700 dark:text-slate-300 dark:ring-slate-900 dark:hover:bg-sky-500/20 dark:hover:text-sky-300"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </Link>
                    }
                  >
                    <button
                      type="button"
                      onClick={() => setUserModalOpen(true)}
                      aria-label="Add user"
                      title="Add user"
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

        <ErrorBoundary
          variant="section"
          sectionTitle="Analytics charts"
          onReset={() => void handleRefresh()}
        >
          <Suspense fallback={<DashboardChartsSkeleton />}>
            <DashboardChartsGrid
              averageProgress={overview?.stats.averageProgress ?? 0}
              totalProjects={totalProjects}
              categoryProgress={overview?.categoryProgress ?? EMPTY_CATEGORY_PROGRESS}
              projectStatusBreakdown={overview?.projectStatusBreakdown ?? EMPTY_STATUS_BREAKDOWN}
              activityTrend={overview?.activityTrend ?? EMPTY_ACTIVITY_TREND}
            />
          </Suspense>
        </ErrorBoundary>

        {overview && overview.recentProjects.length > 0 ? (
          <section className={`${SURFACE_TOKENS.card} p-5`} aria-label="Recent projects">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-4">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Recent Projects
              </h2>
              <Link
                to="/projects"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-700 hover:text-sky-900 dark:text-sky-300 dark:hover:text-sky-200"
              >
                Open Projects Workspace
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 lg:grid-cols-4">
              {overview.recentProjects.map((project) => (
                <Link
                  key={project.id}
                  to="/projects"
                  className="rounded-2xl border border-slate-100 bg-surface-subtle p-3.5 transition hover:border-sky-200 hover:bg-surface dark:border-slate-800 dark:hover:border-sky-500/40"
                >
                  <div className="flex items-center justify-between gap-2 text-[11px]">
                    <span className="font-semibold text-sky-700 capitalize dark:text-sky-300">
                      {project.category}
                    </span>
                    <span className="tabular-nums font-bold text-slate-700 dark:text-slate-200">
                      {project.progress}%
                    </span>
                  </div>
                  <p className="mt-1.5 truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {project.name}
                  </p>
                  <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-200/70 dark:bg-slate-700">
                    <div
                      className={`h-full rounded-full ${
                        project.status === 'completed'
                          ? 'bg-emerald-400 dark:bg-emerald-400'
                          : 'bg-sky-400 dark:bg-sky-400'
                      }`}
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                  <p className="mt-2 text-[11px] text-slate-400">
                    {project.tasksCompleted}/{project.tasksTotal} tasks &middot; {project.ownerName}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <section aria-label="Role-based module access" className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
              <Sparkles className="h-4 w-4 text-sky-600 dark:text-sky-400" />
              Role-Based Module Access
            </h2>
            <div className="flex flex-wrap gap-1.5" aria-label="Assigned permissions">
              {user?.permissions.map((perm) => (
                <span
                  key={perm}
                  className="rounded-full bg-sky-50 px-2.5 py-0.5 text-[11px] font-semibold text-sky-700 ring-1 ring-sky-200/70 dark:bg-sky-500/15 dark:text-sky-300 dark:ring-sky-500/30"
                >
                  {perm}
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {filteredModules.map((mod) => (
              <PermissionGate
                key={mod.permission}
                permission={mod.permission}
                fallback={
                  <article className="rounded-[20px] border border-dashed border-slate-200 bg-surface/60 p-4 dark:border-slate-700">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                        {mod.title}
                      </h3>
                      <Lock className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                    </div>
                    <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">
                      {mod.deniedText}
                    </p>
                  </article>
                }
              >
                <Link
                  to={mod.to}
                  className="bento-shadow block rounded-[20px] border border-slate-200/70 bg-surface p-4 transition hover:border-sky-200 hover:bg-sky-50/20 dark:border-slate-700/80 dark:hover:border-sky-500/40 dark:hover:bg-slate-800/80"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {mod.title}
                    </h3>
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  </div>
                  <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                    {mod.grantedText}
                  </p>
                </Link>
              </PermissionGate>
            ))}
          </div>
        </section>
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
