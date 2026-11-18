import { useState } from 'react';
import { Plus, ShieldCheck, UserCheck, Users, UserX } from 'lucide-react';
import { AppDropdown } from '../../components/AppDropdown';
import { ConfirmDeleteModal } from '../../components/ConfirmDeleteModal';
import { ErrorAlertBanner } from '../../components/ErrorAlertBanner';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { PaginationControls } from '../../components/PaginationControls';
import { SearchInput } from '../../components/SearchInput';
import { TableRowsSkeleton } from '../../components/WorkspaceSkeletons';
import { BUTTON_TOKENS, SURFACE_TOKENS } from '../../theme/tokens';
import type { DirectoryPreviewUser } from '../../types/auth';
import { useAuth } from '../auth/authContext';
import { PermissionGate } from '../auth/PermissionGate';
import { EmployeeTableRow } from './EmployeeTableRow';
import { UserFormModal } from './UserFormModal';
import { useUsersDirectory } from '../../hooks/useUsersDirectory';

export function DirectoryPage() {
  const { user: currentUser } = useAuth();
  const {
    users,
    departments,
    stats,
    pagination,
    search,
    setSearch,
    roleFilter,
    setRoleFilter,
    statusFilter,
    setStatusFilter,
    departmentFilter,
    setDepartmentFilter,
    setPage,
    setLimit,
    loaded,
    isFetching,
    error,
    busyId,
    reloadDirectory,
    handleRoleChange,
    handleStatusToggle,
    handleDeleteUser,
  } = useUsersDirectory();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<DirectoryPreviewUser | null>(null);
  const [deletingMember, setDeletingMember] = useState<DirectoryPreviewUser | null>(null);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-700 ring-1 ring-sky-100 dark:bg-sky-500/15 dark:text-sky-300 dark:ring-sky-500/30">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Employees &amp; Role Management
              </h1>
              <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">
                Create employee accounts, assign departments and roles, and view assigned projects.
              </p>
            </div>
          </div>

          <PermissionGate permission="users:write">
            <button
              type="button"
              onClick={() => {
                setEditingMember(null);
                setModalOpen(true);
              }}
              className={`${BUTTON_TOKENS.primarySoftPill} py-2.5`}
            >
              <Plus className="h-4 w-4" />
              Add Employee
            </button>
          </PermissionGate>
        </div>

        <section className="grid grid-cols-2 gap-4 lg:grid-cols-4" aria-label="Employee summary stats">
          {[
            {
              label: 'Total Employees',
              value: stats.total,
              icon: Users,
              iconWrapClass: 'bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
              valueClass: 'text-slate-900 dark:text-slate-100',
            },
            {
              label: 'Active',
              value: stats.active,
              icon: UserCheck,
              iconWrapClass:
                'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
              valueClass: 'text-emerald-700 dark:text-emerald-300',
            },
            {
              label: 'Admins & Managers',
              value: stats.admins + stats.managers,
              icon: ShieldCheck,
              iconWrapClass:
                'bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
              valueClass: 'text-slate-900 dark:text-slate-100',
            },
            {
              label: 'Suspended',
              value: stats.suspended,
              icon: UserX,
              iconWrapClass: 'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
              valueClass: 'text-rose-700 dark:text-rose-300',
            },
          ].map((card) => {
            const CardIcon = card.icon;
            return (
              <article key={card.label} className={`${SURFACE_TOKENS.panel} p-4`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400">{card.label}</span>
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full ${card.iconWrapClass}`}
                  >
                    <CardIcon className="h-4 w-4" />
                  </span>
                </div>
                {!loaded && !error ? (
                  <div className="mt-2 h-8 w-14 animate-pulse rounded-lg bg-slate-200/80 dark:bg-slate-700/70" />
                ) : (
                  <p className={`tabular-nums mt-2 text-2xl font-bold ${card.valueClass}`}>
                    {card.value}
                  </p>
                )}
              </article>
            );
          })}
        </section>

        <section
          className={`${SURFACE_TOKENS.panel} flex flex-wrap items-center justify-between gap-3 p-4`}
        >
          <div className="flex flex-wrap gap-2">
            {[
              { label: `All (${stats.total})`, value: '' },
              { label: `Active (${stats.active})`, value: 'active' },
              { label: `Suspended (${stats.suspended})`, value: 'suspended' },
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
              placeholder="Search employees by name or email..."
              ariaLabel="Search employees"
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
              value={roleFilter}
              options={[
                { value: '', label: 'All Roles' },
                { value: 'admin', label: `Admin (${stats.admins})` },
                { value: 'manager', label: `Manager (${stats.managers})` },
                { value: 'viewer', label: `Viewer (${stats.viewers})` },
              ]}
              onChange={setRoleFilter}
              ariaLabel="Filter by role"
            />
          </div>
        </section>

        {error ? (
          <ErrorAlertBanner
            message={error}
            onRetry={() => void reloadDirectory()}
            retrying={isFetching}
          />
        ) : null}

        <section className={`${SURFACE_TOKENS.card} overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-surface-subtle dark:border-slate-800">
                <tr className="text-[11px] font-semibold text-slate-400 uppercase">
                  <th className="px-5 py-3.5">Employee</th>
                  <th className="px-5 py-3.5">Email</th>
                  <th className="px-5 py-3.5">Department</th>
                  <th className="px-5 py-3.5">Role</th>
                  <th className="px-5 py-3.5">Assigned Projects</th>
                  <th className="px-5 py-3.5">Status</th>
                  <PermissionGate permission="users:write">
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </PermissionGate>
                </tr>
              </thead>
              <tbody
                className={`divide-y divide-slate-100 transition-opacity dark:divide-slate-800 ${
                  isFetching && loaded ? 'opacity-60' : ''
                }`}
              >
                {!loaded ? (
                  <TableRowsSkeleton
                    columns={currentUser?.permissions.includes('users:write') ? 7 : 6}
                    ariaLabel="Loading employees"
                    showAvatar
                  />
                ) : users.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-8 text-center text-sm text-slate-500 dark:text-slate-400"
                    >
                      No matching employees found.
                    </td>
                  </tr>
                ) : (
                  users.map((member) => (
                    <EmployeeTableRow
                      key={member.id}
                      member={member}
                      isSelf={member.id === currentUser?.id}
                      isBusy={busyId === member.id}
                      departmentFilter={departmentFilter}
                      onToggleDepartment={setDepartmentFilter}
                      onRoleChange={(target, role) => void handleRoleChange(target, role)}
                      onStatusToggle={(target) => void handleStatusToggle(target)}
                      onEdit={(target) => {
                        setEditingMember(target);
                        setModalOpen(true);
                      }}
                      onDelete={(target) => setDeletingMember(target)}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <PaginationControls
          pagination={pagination}
          itemLabel="employees"
          limitOptions={[5, 10, 20]}
          isFetching={isFetching}
          onPageChange={setPage}
          onLimitChange={setLimit}
        />
      </div>

      {modalOpen ? (
        <UserFormModal
          member={editingMember}
          currentUserId={currentUser?.id}
          onClose={() => {
            setModalOpen(false);
            setEditingMember(null);
          }}
          onSaved={() => {
            setModalOpen(false);
            setEditingMember(null);
          }}
        />
      ) : null}

      {deletingMember ? (
        <ConfirmDeleteModal
          title="Delete Employee"
          itemName={`${deletingMember.name} (${deletingMember.email})`}
          description="This employee account and active refresh sessions will be permanently removed. This action cannot be undone."
          confirmLabel="Delete Employee"
          deleting={busyId === deletingMember.id}
          onCancel={() => setDeletingMember(null)}
          onConfirm={async () => {
            await handleDeleteUser(deletingMember);
            setDeletingMember(null);
          }}
        />
      ) : null}
    </DashboardLayout>
  );
}
