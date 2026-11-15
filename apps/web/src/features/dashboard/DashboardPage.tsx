import { useState } from 'react';
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
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { BADGE_TOKENS, BUTTON_TOKENS } from '../../theme/tokens';
import { useAuth } from '../auth/authContext';
import { PermissionGate } from '../auth/PermissionGate';
import { UserFormModal } from '../directory/UserFormModal';
import { HealthStatusCard } from '../health/HealthStatusCard';
import { ProjectFormModal } from '../projects/ProjectFormModal';
import { AccessCoverageChartCard } from './components/AccessCoverageChartCard';
import { AuthActivityTrendCard } from './components/AuthActivityTrendCard';
import { DirectoryStatusDonutCard } from './components/DirectoryStatusDonutCard';
import { StatBentoCard } from './components/StatBentoCard';
import { useDashboardOverview } from './useDashboardOverview';

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
        {/* Overview Title Row */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-[28px]">
              Project &amp; Administration Overview
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Welcome back, <span className="font-semibold text-slate-700">{user?.name}</span> &middot;
              Live project metrics, team capacity, and RBAC governance
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => void handleRefresh()}
              disabled={refreshing}
              className={`${BUTTON_TOKENS.secondaryPill} py-2.5`}
            >
              <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${refreshing ? 'animate-spin' : ''}`} />
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
          <div className={BUTTON_TOKENS.alertError} role="alert">
            {error}
          </div>
        ) : null}

        {/* Top 3 KPI Bento Cards */}
        <section
          className="grid grid-cols-1 gap-5 md:grid-cols-3"
          aria-label="Workspace key metrics"
        >
          <StatBentoCard
            title="Active Projects"
            value={overview ? activeProjects : '...'}
            delta={`${totalProjects} total`}
            footerLabel="Live project tracker"
            to="/projects"
            tone="mint"
            icon={FolderKanban}
            rightSlot={
              <span className="rounded-full border border-slate-200/80 bg-slate-50 px-2.5 py-0.5 text-[11px] font-medium text-slate-600">
                Workspace
              </span>
            }
          />

          <StatBentoCard
            title="Total Tasks"
            value={overview ? totalTasks : '...'}
            delta={`${taskRate}% done`}
            footerLabel={`${completedTasks} completed tasks`}
            to="/projects"
            tone="sky"
            icon={CheckSquare}
            rightSlot={
              <span className="rounded-full border border-slate-200/80 bg-slate-50 px-2.5 py-0.5 text-[11px] font-medium text-slate-600">
                Milestones
              </span>
            }
          />

          <StatBentoCard
            title="Team Members"
            value={overview ? totalUsers : '...'}
            delta={
              overview
                ? overview.stats.activeSessions === null
                  ? 'Directory'
                  : `${overview.stats.activeSessions} sessions`
                : undefined
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
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold ring-2 ring-white ${
                      BADGE_TOKENS.avatarTones[idx % BADGE_TOKENS.avatarTones.length]
                    }`}
                  >
                    {member.name.slice(0, 2).toUpperCase()}
                  </span>
                ))}
                <PermissionGate
                  permission="users:write"
                  fallback={
                    <Link
                      to="/users"
                      aria-label="View users"
                      className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-500 ring-2 ring-white hover:bg-sky-50 hover:text-sky-700"
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
                    className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-500 ring-2 ring-white hover:bg-sky-50 hover:text-sky-700"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </PermissionGate>
              </div>
            }
          />
        </section>

        {/* Bottom 3 Interactive Recharts Bento Cards */}
        <section
          className="grid grid-cols-1 gap-5 lg:grid-cols-3"
          aria-label="Live project and activity charts"
        >
          <AccessCoverageChartCard
            averageProgress={overview?.stats.averageProgress ?? 0}
            totalProjects={totalProjects}
            categoryProgress={overview?.categoryProgress ?? []}
          />

          <DirectoryStatusDonutCard
            totalProjects={totalProjects}
            projectStatusBreakdown={overview?.projectStatusBreakdown ?? []}
          />

          <AuthActivityTrendCard activityTrend={overview?.activityTrend ?? []} />
        </section>

        {/* Recent Projects Quick List */}
        {overview && overview.recentProjects.length > 0 ? (
          <section
            className="bento-shadow rounded-[24px] border border-slate-200/70 bg-white p-5"
            aria-label="Recent projects"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 pb-4">
              <h2 className="text-base font-semibold text-slate-900">Recent Projects</h2>
              <Link
                to="/projects"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-700 hover:text-sky-900"
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
                  className="rounded-2xl border border-slate-100 bg-slate-50/75 p-3.5 transition hover:border-sky-200 hover:bg-white"
                >
                  <div className="flex items-center justify-between gap-2 text-[11px]">
                    <span className="font-semibold text-sky-700 capitalize">{project.category}</span>
                    <span className="tabular-nums font-bold text-slate-700">
                      {project.progress}%
                    </span>
                  </div>
                  <p className="mt-1.5 truncate text-sm font-semibold text-slate-900">
                    {project.name}
                  </p>
                  <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-200/70">
                    <div
                      className={`h-full rounded-full ${
                        project.status === 'completed' ? 'bg-emerald-300' : 'bg-sky-300'
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

        {/* RBAC Module Access Strip */}
        <section aria-label="Role-based module access" className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <Sparkles className="h-4 w-4 text-sky-600" />
              Role-Based Module Access
            </h2>
            <div className="flex flex-wrap gap-1.5" aria-label="Assigned permissions">
              {user?.permissions.map((perm) => (
                <span
                  key={perm}
                  className="rounded-full bg-sky-50 px-2.5 py-0.5 text-[11px] font-semibold text-sky-700 ring-1 ring-sky-200/70"
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
                  <article className="rounded-[20px] border border-dashed border-slate-200 bg-white/60 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold text-slate-500">{mod.title}</h3>
                      <Lock className="h-3.5 w-3.5 text-slate-400" />
                    </div>
                    <p className="mt-1.5 text-xs text-slate-400">{mod.deniedText}</p>
                  </article>
                }
              >
                <Link
                  to={mod.to}
                  className="bento-shadow block rounded-[20px] border border-slate-200/70 bg-white p-4 transition hover:border-sky-200 hover:bg-sky-50/20"
                >
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-slate-900">{mod.title}</h3>
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  </div>
                  <p className="mt-1.5 text-xs text-slate-500">{mod.grantedText}</p>
                </Link>
              </PermissionGate>
            ))}
          </div>
        </section>

        <HealthStatusCard />
      </div>

      {createModalOpen ? (
        <ProjectFormModal
          onClose={() => setCreateModalOpen(false)}
          onSaved={() => {
            setCreateModalOpen(false);
            void handleRefresh();
          }}
        />
      ) : null}

      {userModalOpen ? (
        <UserFormModal
          currentUserId={user?.id}
          onClose={() => setUserModalOpen(false)}
          onSaved={() => {
            setUserModalOpen(false);
            void handleRefresh();
          }}
        />
      ) : null}
    </DashboardLayout>
  );
}
