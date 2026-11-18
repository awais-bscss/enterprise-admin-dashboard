import { useState } from 'react';
import { Building2, Pencil, Plus, Trash2 } from 'lucide-react';
import { ConfirmDeleteModal } from '../../components/ConfirmDeleteModal';
import { ErrorAlertBanner } from '../../components/ErrorAlertBanner';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { LinkedCountPill } from '../../components/LinkedCountPill';
import { PaginationControls } from '../../components/PaginationControls';
import { SearchInput } from '../../components/SearchInput';
import { StatusSummaryCards } from '../../components/StatusSummaryCards';
import { TableRowsSkeleton } from '../../components/WorkspaceSkeletons';
import { useDepartmentsWorkspace } from '../../hooks/useDepartmentsWorkspace';
import { getInitials } from '../../lib/formatters';
import { BADGE_TOKENS, BUTTON_TOKENS, SURFACE_TOKENS } from '../../theme/tokens';
import type { DepartmentItem } from '../../types/auth';
import { useAuth } from '../auth/authContext';
import { PermissionGate } from '../auth/PermissionGate';
import { DepartmentFormModal } from './DepartmentFormModal';

export function DepartmentsPage() {
  const { user: currentUser } = useAuth();
  const {
    items: departments,
    stats,
    pagination,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    setPage,
    setLimit,
    loaded,
    isFetching,
    error,
    busyId,
    reload,
    handleStatusToggle,
    handleDelete,
  } = useDepartmentsWorkspace();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<DepartmentItem | null>(null);
  const [deletingDepartment, setDeletingDepartment] = useState<DepartmentItem | null>(null);
  const canWrite = Boolean(currentUser?.permissions.includes('departments:write'));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-700 ring-1 ring-violet-100 dark:bg-violet-500/15 dark:text-violet-300 dark:ring-violet-500/30">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Departments
              </h1>
              <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">
                Organize teams, department codes, and functional leadership.
              </p>
            </div>
          </div>

          <PermissionGate permission="departments:write">
            <button
              type="button"
              onClick={() => {
                setEditingDepartment(null);
                setModalOpen(true);
              }}
              className={`${BUTTON_TOKENS.primarySoftPill} py-2.5`}
            >
              <Plus className="h-4 w-4" />
              Add Department
            </button>
          </PermissionGate>
        </div>

        <StatusSummaryCards
          totalLabel="Total Departments"
          stats={stats}
          icon={Building2}
          ariaLabel="Department summary stats"
          loading={!loaded && !error}
        />

        <section
          className={`${SURFACE_TOKENS.panel} flex flex-wrap items-center justify-between gap-3 p-4`}
        >
          <div className="flex flex-wrap gap-2">
            {[
              { label: `All (${stats.total})`, value: '' },
              { label: `Active (${stats.active})`, value: 'active' },
              { label: `Inactive (${stats.inactive})`, value: 'inactive' },
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

          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search departments, codes, or heads..."
            ariaLabel="Search departments"
          />
        </section>

        {error ? (
          <ErrorAlertBanner message={error} onRetry={() => void reload()} retrying={isFetching} />
        ) : null}

        <section className={`${SURFACE_TOKENS.card} overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-surface-subtle dark:border-slate-800">
                <tr className="text-[11px] font-semibold text-slate-400 uppercase">
                  <th className="px-5 py-3.5">Department</th>
                  <th className="px-5 py-3.5">Code</th>
                  <th className="px-5 py-3.5">Head</th>
                  <th className="px-5 py-3.5">Employees</th>
                  <th className="px-5 py-3.5">Projects</th>
                  <th className="px-5 py-3.5">Status</th>
                  {canWrite ? <th className="px-5 py-3.5 text-right">Actions</th> : null}
                </tr>
              </thead>
              <tbody
                className={`divide-y divide-slate-100 transition-opacity dark:divide-slate-800 ${
                  isFetching && loaded ? 'opacity-60' : ''
                }`}
              >
                {!loaded ? (
                  <TableRowsSkeleton
                    columns={canWrite ? 7 : 6}
                    ariaLabel="Loading departments"
                  />
                ) : departments.length === 0 ? (
                  <tr>
                    <td
                      colSpan={canWrite ? 7 : 6}
                      className="px-5 py-10 text-center text-sm text-slate-500 dark:text-slate-400"
                    >
                      No matching departments found.
                    </td>
                  </tr>
                ) : (
                  departments.map((dept) => {
                    const isBusy = busyId === dept.id;
                    return (
                      <tr key={dept.id} className="hover:bg-surface-subtle/60">
                        <td className="max-w-sm px-5 py-3.5">
                          <p className="font-semibold text-slate-900 dark:text-slate-100">
                            {dept.name}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                            {dept.description || 'No description provided.'}
                          </p>
                        </td>

                        <td className="px-5 py-3.5">
                          <span className="rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-semibold text-violet-700 ring-1 ring-violet-200/70 dark:bg-violet-500/15 dark:text-violet-300 dark:ring-violet-500/30">
                            {dept.code}
                          </span>
                        </td>

                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sky-50 text-[10px] font-bold text-sky-800 ring-1 ring-sky-100 dark:bg-sky-500/15 dark:text-sky-300 dark:ring-sky-500/30">
                              {getInitials(dept.headName)}
                            </span>
                            <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
                              {dept.headName}
                            </span>
                          </div>
                        </td>

                        <td className="px-5 py-3.5">
                          <LinkedCountPill
                            count={dept.employeeCount ?? 0}
                            singular="employee"
                            plural="employees"
                            to={`/employees?departmentId=${dept.id}`}
                            title={`View employees in ${dept.name}`}
                          />
                        </td>

                        <td className="px-5 py-3.5">
                          <LinkedCountPill
                            count={dept.projectCount ?? 0}
                            singular="project"
                            plural="projects"
                            to={`/projects?departmentId=${dept.id}`}
                            title={`View projects in ${dept.name}`}
                          />
                        </td>

                        <td className="px-5 py-3.5">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${BADGE_TOKENS.entityStatus[dept.status]}`}
                          >
                            {dept.status}
                          </span>
                        </td>

                        {canWrite ? (
                          <td className="px-5 py-3.5">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => void handleStatusToggle(dept)}
                                className="cursor-pointer rounded-full border border-slate-200 bg-surface px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                              >
                                {dept.status === 'active' ? 'Deactivate' : 'Activate'}
                              </button>

                              <button
                                type="button"
                                disabled={isBusy}
                                aria-label={`Edit ${dept.name}`}
                                onClick={() => {
                                  setEditingDepartment(dept);
                                  setModalOpen(true);
                                }}
                                className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-surface text-slate-500 transition hover:bg-sky-50 hover:text-sky-700 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-sky-500/20 dark:hover:text-sky-300"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>

                              <button
                                type="button"
                                disabled={isBusy}
                                aria-label={`Delete ${dept.name}`}
                                onClick={() => setDeletingDepartment(dept)}
                                className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-surface text-slate-500 transition hover:bg-rose-50 hover:text-rose-600 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-rose-500/20 dark:hover:text-rose-300"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        ) : null}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        <PaginationControls
          pagination={pagination}
          itemLabel="departments"
          limitOptions={[10, 20, 50]}
          isFetching={isFetching}
          onPageChange={setPage}
          onLimitChange={setLimit}
        />
      </div>

      {modalOpen ? (
        <DepartmentFormModal
          department={editingDepartment}
          onClose={() => {
            setModalOpen(false);
            setEditingDepartment(null);
          }}
          onSaved={() => {
            setModalOpen(false);
            setEditingDepartment(null);
          }}
        />
      ) : null}

      {deletingDepartment ? (
        <ConfirmDeleteModal
          title="Delete Department"
          itemName={`${deletingDepartment.name} (${deletingDepartment.code})`}
          description="This department record will be permanently removed from the workspace. This action cannot be undone."
          confirmLabel="Delete Department"
          deleting={busyId === deletingDepartment.id}
          onCancel={() => setDeletingDepartment(null)}
          onConfirm={async () => {
            await handleDelete(deletingDepartment);
            setDeletingDepartment(null);
          }}
        />
      ) : null}
    </DashboardLayout>
  );
}
