import { useState } from 'react';
import { ArrowUpDown, FolderKanban, Plus } from 'lucide-react';
import { AppDropdown, type DropdownOption } from '../../components/AppDropdown';
import { ConfirmDeleteModal } from '../../components/ConfirmDeleteModal';
import { ErrorAlertBanner } from '../../components/ErrorAlertBanner';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { PaginationControls } from '../../components/PaginationControls';
import { SearchInput } from '../../components/SearchInput';
import { TableRowsSkeleton } from '../../components/WorkspaceSkeletons';
import { useProjectsWorkspace } from '../../hooks/useProjectsWorkspace';
import { BUTTON_TOKENS, SURFACE_TOKENS } from '../../theme/tokens';
import type { ProjectItem } from '../../types/auth';
import { useAuth } from '../auth/authContext';
import { PermissionGate } from '../auth/PermissionGate';
import { ProjectFormModal } from './ProjectFormModal';
import { ProjectTableRow } from './ProjectTableRow';

const PROJECT_SORT_OPTIONS: readonly DropdownOption[] = [
  { value: '', label: 'Recently Updated' },
  { value: 'deadline', label: 'Nearest Deadline' },
  { value: 'newest', label: 'Newest Created' },
  { value: 'progress', label: 'Highest Progress' },
];

export function ProjectsPage() {
  const { user: currentUser } = useAuth();
  const {
    projects,
    departments,
    clients,
    employees,
    stats,
    pagination,
    loaded,
    isFetching,
    error,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    departmentFilter,
    setDepartmentFilter,
    clientFilter,
    setClientFilter,
    ownerFilter,
    setOwnerFilter,
    sort,
    setSort,
    setPage,
    setLimit,
    busyId,
    reloadProjects,
    handleDelete,
  } = useProjectsWorkspace();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectItem | null>(null);
  const [deletingProject, setDeletingProject] = useState<ProjectItem | null>(null);
  const canWrite = Boolean(currentUser?.permissions.includes('projects:write'));

  return (
    <DashboardLayout>
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
              <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">
                Create, track, and manage projects synced with departments and clients.
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
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search projects..."
              ariaLabel="Search projects"
            />

            <AppDropdown
              value={departmentFilter}
              searchable
              searchPlaceholder="Search departments..."
              options={[
                { value: '', label: 'All Departments' },
                ...departments.map((dept) => ({
                  value: dept.id,
                  label: dept.name,
                })),
              ]}
              onChange={setDepartmentFilter}
              ariaLabel="Filter by department"
            />

            <AppDropdown
              value={clientFilter}
              searchable
              searchPlaceholder="Search clients..."
              options={[
                { value: '', label: 'All Clients' },
                ...clients.map((client) => ({
                  value: client.id,
                  label: client.company,
                })),
              ]}
              onChange={setClientFilter}
              ariaLabel="Filter by client"
            />

            <AppDropdown
              value={ownerFilter}
              searchable
              searchPlaceholder="Search employees..."
              options={[
                { value: '', label: 'All Employees' },
                ...employees.map((emp) => ({
                  value: emp.id,
                  label: emp.name,
                })),
              ]}
              onChange={setOwnerFilter}
              ariaLabel="Filter by employee"
            />

            <AppDropdown
              value={sort}
              options={PROJECT_SORT_OPTIONS}
              onChange={setSort}
              triggerIcon={ArrowUpDown}
              ariaLabel="Sort projects"
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

        <section className={`${SURFACE_TOKENS.card} overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-surface-subtle dark:border-slate-800">
                <tr className="text-[11px] font-semibold text-slate-400 uppercase">
                  <th className="px-5 py-3.5">Project</th>
                  <th className="px-5 py-3.5">Department</th>
                  <th className="px-5 py-3.5">Client</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Progress</th>
                  <th className="px-5 py-3.5">Priority</th>
                  <th className="px-5 py-3.5">Assigned Team</th>
                  <th className="px-5 py-3.5">Due Date</th>
                  {canWrite ? <th className="px-5 py-3.5 text-right">Actions</th> : null}
                </tr>
              </thead>
              <tbody
                className={`divide-y divide-slate-100 transition-opacity dark:divide-slate-800 ${
                  isFetching && loaded ? 'opacity-60' : ''
                }`}
              >
                {!loaded ? (
                  <TableRowsSkeleton columns={canWrite ? 9 : 8} ariaLabel="Loading projects" />
                ) : projects.length === 0 ? (
                  <tr>
                    <td
                      colSpan={canWrite ? 9 : 8}
                      className="px-5 py-10 text-center text-sm text-slate-500 dark:text-slate-400"
                    >
                      No projects match this filter.
                    </td>
                  </tr>
                ) : (
                  projects.map((project) => (
                    <ProjectTableRow
                      key={project.id}
                      project={project}
                      canWrite={canWrite}
                      isBusy={busyId === project.id}
                      departmentFilter={departmentFilter}
                      clientFilter={clientFilter}
                      ownerFilter={ownerFilter}
                      onToggleDepartment={setDepartmentFilter}
                      onToggleClient={setClientFilter}
                      onToggleOwner={setOwnerFilter}
                      onEdit={(target) => {
                        setEditingProject(target);
                        setModalOpen(true);
                      }}
                      onDelete={(target) => setDeletingProject(target)}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <PaginationControls
          pagination={pagination}
          itemLabel="projects"
          limitOptions={[8, 15, 25]}
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
