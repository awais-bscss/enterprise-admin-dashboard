import { useState } from 'react';
import { CheckCircle2, FileUp, FolderKanban, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { AppDropdown, type DropdownOption } from '../../components/AppDropdown';
import { ConfirmDeleteModal } from '../../components/ConfirmDeleteModal';
import { ErrorAlertBanner } from '../../components/ErrorAlertBanner';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { PaginationControls } from '../../components/PaginationControls';
import { ProjectsGridSkeleton } from '../../components/WorkspaceSkeletons';
import { getInitials } from '../../lib/formatters';
import { BADGE_TOKENS, BUTTON_TOKENS, SURFACE_TOKENS } from '../../theme/tokens';
import type { ProjectItem } from '../../types/auth';
import { PermissionGate } from '../auth/PermissionGate';
import { ImportProjectsModal } from './ImportProjectsModal';
import { ProjectFormModal } from './ProjectFormModal';
import { useProjectsWorkspace } from '../../hooks/useProjectsWorkspace';

const TRACK_FILTER_OPTIONS: readonly DropdownOption[] = [
  { value: '', label: 'All Tracks' },
  { value: 'development', label: 'Development' },
  { value: 'design', label: 'Design' },
  { value: 'testing', label: 'Testing' },
  { value: 'security', label: 'Security' },
];

export function ProjectsPage() {
  const {
    projects,
    stats,
    pagination,
    loaded,
    isFetching,
    error,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    categoryFilter,
    setCategoryFilter,
    setPage,
    setLimit,
    busyId,
    reloadProjects,
    handleQuickCompleteTask,
    handleDelete,
  } = useProjectsWorkspace();
  const [modalOpen, setModalOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectItem | null>(null);
  const [deletingProject, setDeletingProject] = useState<ProjectItem | null>(null);

  return (
    <DashboardLayout searchQuery={search} onSearchChange={setSearch}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/30">
              <FolderKanban className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Projects Workspace
              </h1>
              <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                Create, track, and update live initiatives synced with MongoDB.
              </p>
            </div>
          </div>

          <PermissionGate permission="projects:write">
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => setImportOpen(true)}
                className={`${BUTTON_TOKENS.secondaryPill} py-2.5`}
              >
                <FileUp className="h-4 w-4" />
                Import
              </button>

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
            </div>
          </PermissionGate>
        </div>

        <section
          className={`${SURFACE_TOKENS.card} flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5`}
        >
          <div className="flex flex-wrap items-center gap-2">
            {[
              { label: `All (${stats.total})`, value: '' },
              { label: `In Progress (${stats.inProgress})`, value: 'in_progress' },
              { label: `Completed (${stats.completed})`, value: 'completed' },
              { label: `Upcoming (${stats.upcoming})`, value: 'upcoming' },
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
                className="h-9 rounded-full border border-slate-200 bg-slate-50 pr-3 pl-8 text-xs text-slate-800 focus:border-sky-300 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <AppDropdown
              value={categoryFilter}
              options={TRACK_FILTER_OPTIONS}
              onChange={setCategoryFilter}
              ariaLabel="Filter by track"
            />
          </div>
        </section>

        {error ? (
          <ErrorAlertBanner
            message={error}
            onRetry={() => void reloadProjects()}
            retrying={isFetching}
          />
        ) : null}

        {!loaded ? (
          <ProjectsGridSkeleton />
        ) : projects.length === 0 ? (
          <div className="bento-shadow rounded-bento border border-dashed border-slate-200 bg-surface p-10 text-center dark:border-slate-700">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              No projects match this filter
            </p>
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

                    <h2 className="mt-3 text-base font-bold text-slate-900 dark:text-slate-100">
                      {project.name}
                    </h2>
                    <p className="mt-1 line-clamp-2 min-h-[36px] text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                      {project.description || 'No description provided.'}
                    </p>

                    <div className="mt-4 rounded-2xl bg-surface-subtle p-3">
                      <div className="mb-1.5 flex items-center justify-between text-xs">
                        <span className="font-medium text-slate-500 dark:text-slate-400">
                          Tasks: {project.tasksCompleted}/{project.tasksTotal}
                        </span>
                        <span className="tabular-nums font-bold text-slate-800 dark:text-slate-100">
                          {project.progress}%
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200/70 dark:bg-slate-700">
                        <div
                          className={`h-full rounded-full transition-all ${
                            project.status === 'completed'
                              ? 'bg-emerald-400 dark:bg-emerald-400'
                              : 'bg-sky-400 dark:bg-sky-400'
                          }`}
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3.5 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-50 text-[10px] font-bold text-sky-800 ring-1 ring-sky-100 dark:bg-sky-500/15 dark:text-sky-300 dark:ring-sky-500/30">
                        {getInitials(project.owner.name)}
                      </span>
                      <div className="leading-tight">
                        <p className="text-xs font-medium text-slate-700 dark:text-slate-200">
                          {project.owner.name}
                        </p>
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
                            className="inline-flex cursor-pointer items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50 dark:bg-emerald-500/15 dark:text-emerald-300 dark:hover:bg-emerald-500/25"
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
                          className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-surface text-slate-500 transition hover:bg-sky-50 hover:text-sky-700 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-sky-500/20 dark:hover:text-sky-300"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>

                        <button
                          type="button"
                          disabled={isBusy}
                          aria-label={`Delete ${project.name}`}
                          onClick={() => setDeletingProject(project)}
                          className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-surface text-slate-500 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-rose-500/20 dark:hover:text-rose-300"
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

        <PaginationControls
          pagination={pagination}
          itemLabel="projects"
          limitOptions={[6, 9, 12]}
          isFetching={isFetching}
          onPageChange={setPage}
          onLimitChange={setLimit}
        />
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
          }}
        />
      ) : null}

      {importOpen ? (
        <ImportProjectsModal
          onClose={() => setImportOpen(false)}
          onImported={() => setImportOpen(false)}
        />
      ) : null}

      {deletingProject ? (
        <ConfirmDeleteModal
          title="Delete Project"
          itemName={deletingProject.name}
          description="This project and its tracked progress will be permanently removed from the workspace. This action cannot be undone."
          confirmLabel="Delete Project"
          deleting={busyId === deletingProject.id}
          onCancel={() => setDeletingProject(null)}
          onConfirm={async () => {
            await handleDelete(deletingProject);
            setDeletingProject(null);
          }}
        />
      ) : null}
    </DashboardLayout>
  );
}
