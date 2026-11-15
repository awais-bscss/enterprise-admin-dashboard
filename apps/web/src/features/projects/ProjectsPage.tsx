import { useState } from 'react';
import {
  CheckCircle2,
  FolderKanban,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { BADGE_TOKENS, BUTTON_TOKENS, SURFACE_TOKENS } from '../../theme/tokens';
import type { ProjectItem } from '../../types/auth';
import { PermissionGate } from '../auth/PermissionGate';
import { ProjectFormModal } from './ProjectFormModal';
import { useProjectsWorkspace } from './useProjectsWorkspace';

export function ProjectsPage() {
  const {
    projects,
    loaded,
    error,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    categoryFilter,
    setCategoryFilter,
    busyId,
    completedCount,
    inProgressCount,
    upcomingCount,
    reloadProjects,
    handleQuickCompleteTask,
    handleDelete,
  } = useProjectsWorkspace();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectItem | null>(null);

  return (
    <DashboardLayout searchQuery={search} onSearchChange={setSearch}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
              <FolderKanban className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Projects Workspace
              </h1>
              <p className="mt-0.5 text-sm text-slate-500">
                Create, track, and update live initiatives synced with MongoDB.
              </p>
            </div>
          </div>

          <PermissionGate permission="projects:write">
            <button
              type="button"
              onClick={() => {
                setEditingProject(null);
                setModalOpen(true);
              }}
              className={`${BUTTON_TOKENS.primarySoftPill} py-2.5`}
            >
              <Plus className="h-4 w-4" />
              New Project
            </button>
          </PermissionGate>
        </div>

        {/* Summary Counters + Filter Controls */}
        <section className={`${SURFACE_TOKENS.card} flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5`}>
          <div className="flex flex-wrap items-center gap-2">
            {[
              { label: `All (${projects.length})`, value: '' },
              { label: `In Progress (${inProgressCount})`, value: 'in_progress' },
              { label: `Completed (${completedCount})`, value: 'completed' },
              { label: `Upcoming (${upcomingCount})`, value: 'upcoming' },
            ].map((pill) => (
              <button
                key={pill.label}
                type="button"
                onClick={() => setStatusFilter(pill.value)}
                className={
                  statusFilter === pill.value
                    ? BUTTON_TOKENS.filterActive
                    : BUTTON_TOKENS.filterIdle
                }
              >
                {pill.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative sm:hidden">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search projects..."
                className="h-9 rounded-full border border-slate-200 bg-slate-50 pr-3 pl-8 text-xs text-slate-800 focus:border-sky-300 focus:bg-white focus:outline-none"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              aria-label="Filter by track"
              className="h-9 rounded-full border border-slate-200 bg-slate-50 px-3.5 text-xs font-medium text-slate-700 focus:border-sky-300 focus:bg-white focus:outline-none"
            >
              <option value="">All Tracks</option>
              <option value="development">Development</option>
              <option value="design">Design</option>
              <option value="testing">Testing</option>
              <option value="security">Security</option>
            </select>
          </div>
        </section>

        {error ? (
          <div className={BUTTON_TOKENS.alertError} role="alert">
            {error}
          </div>
        ) : null}

        {!loaded ? (
          <div className={`${SURFACE_TOKENS.card} p-8 text-center text-sm text-slate-500`}>
            Loading projects...
          </div>
        ) : projects.length === 0 ? (
          <div className="bento-shadow rounded-bento border border-dashed border-slate-200 bg-surface p-10 text-center">
            <p className="text-sm font-semibold text-slate-700">No projects match this filter</p>
            <p className="mt-1 text-xs text-slate-400">
              Try clearing your filters or create a new project to start tracking.
            </p>
          </div>
        ) : (
          <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {projects.map((project) => {
              const statusMeta = BADGE_TOKENS.projectStatus[project.status];
              const isBusy = busyId === project.id;

              return (
                <article
                  key={project.id}
                  className={`${SURFACE_TOKENS.cardInteractive} flex flex-col justify-between p-5`}
                >
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${BADGE_TOKENS.projectCategory[project.category]}`}
                      >
                        {project.category}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusMeta.className}`}
                      >
                        {statusMeta.label}
                      </span>
                    </div>

                    <h2 className="mt-3 text-base font-bold text-slate-900">{project.name}</h2>
                    <p className="mt-1 line-clamp-2 min-h-[36px] text-xs leading-relaxed text-slate-500">
                      {project.description || 'No description provided.'}
                    </p>

                    <div className="mt-4 rounded-2xl bg-slate-50/80 p-3">
                      <div className="mb-1.5 flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-500">
                          Tasks: {project.tasksCompleted}/{project.tasksTotal}
                        </span>
                        <span className="tabular-nums font-bold text-slate-800">
                          {project.progress}%
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200/70">
                        <div
                          className={`h-full rounded-full transition-all ${
                            project.status === 'completed' ? 'bg-emerald-300' : 'bg-sky-300'
                          }`}
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3.5">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-50 text-[10px] font-bold text-sky-800 ring-1 ring-sky-100">
                        {project.owner.name.slice(0, 2).toUpperCase()}
                      </span>
                      <div className="leading-tight">
                        <p className="text-xs font-medium text-slate-700">{project.owner.name}</p>
                        <p className="text-[10px] text-slate-400 capitalize">
                          {project.priority} priority
                        </p>
                      </div>
                    </div>

                    <PermissionGate permission="projects:write">
                      <div className="flex items-center gap-1.5">
                        {project.tasksCompleted < project.tasksTotal ? (
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => void handleQuickCompleteTask(project)}
                            title="Complete one task"
                            className="inline-flex cursor-pointer items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            +1 Task
                          </button>
                        ) : null}

                        <button
                          type="button"
                          disabled={isBusy}
                          aria-label={`Edit ${project.name}`}
                          onClick={() => {
                            setEditingProject(project);
                            setModalOpen(true);
                          }}
                          className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:bg-sky-50 hover:text-sky-700 disabled:opacity-50"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>

                        <button
                          type="button"
                          disabled={isBusy}
                          aria-label={`Delete ${project.name}`}
                          onClick={() => void handleDelete(project)}
                          className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </PermissionGate>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>

      {modalOpen ? (
        <ProjectFormModal
          project={editingProject}
          onClose={() => {
            setModalOpen(false);
            setEditingProject(null);
          }}
          onSaved={() => {
            setModalOpen(false);
            setEditingProject(null);
            void reloadProjects();
          }}
        />
      ) : null}
    </DashboardLayout>
  );
}
