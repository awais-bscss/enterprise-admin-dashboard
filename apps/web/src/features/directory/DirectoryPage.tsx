import { useState } from 'react';
import { Pencil, Plus, ShieldCheck, Trash2, UserCheck, Users, UserX } from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { BADGE_TOKENS, BUTTON_TOKENS, SURFACE_TOKENS } from '../../theme/tokens';
import type { DirectoryPreviewUser, Role } from '../../types/auth';
import { useAuth } from '../auth/authContext';
import { PermissionGate } from '../auth/PermissionGate';
import { UserFormModal } from './UserFormModal';
import { useUsersDirectory } from './useUsersDirectory';

export function DirectoryPage() {
  const { user: currentUser } = useAuth();
  const {
    users,
    stats,
    search,
    setSearch,
    roleFilter,
    setRoleFilter,
    statusFilter,
    setStatusFilter,
    loaded,
    error,
    busyId,
    confirmDeleteId,
    setConfirmDeleteId,
    reloadDirectory,
    handleRoleChange,
    handleStatusToggle,
    handleDeleteUser,
  } = useUsersDirectory();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<DirectoryPreviewUser | null>(null);

  return (
    <DashboardLayout searchQuery={search} onSearchChange={setSearch}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-700 ring-1 ring-sky-100">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Users &amp; Role Management
              </h1>
              <p className="mt-0.5 text-sm text-slate-500">
                Create accounts, assign RBAC roles, manage status, and inspect owned projects.
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
              Add User
            </button>
          </PermissionGate>
        </div>

        {/* Summary KPI Bento Strip */}
        <section className="grid grid-cols-2 gap-4 lg:grid-cols-4" aria-label="User summary stats">
          <article className={`${SURFACE_TOKENS.panel} p-4`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Total Users</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-50 text-sky-700">
                <Users className="h-4 w-4" />
              </span>
            </div>
            <p className="tabular-nums mt-2 text-2xl font-bold text-slate-900">{stats.total}</p>
          </article>

          <article className={`${SURFACE_TOKENS.panel} p-4`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Active</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                <UserCheck className="h-4 w-4" />
              </span>
            </div>
            <p className="tabular-nums mt-2 text-2xl font-bold text-emerald-700">{stats.active}</p>
          </article>

          <article className={`${SURFACE_TOKENS.panel} p-4`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Admins &amp; Managers</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-50 text-violet-700">
                <ShieldCheck className="h-4 w-4" />
              </span>
            </div>
            <p className="tabular-nums mt-2 text-2xl font-bold text-slate-900">
              {stats.admins + stats.managers}
            </p>
          </article>

          <article className={`${SURFACE_TOKENS.panel} p-4`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Suspended</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-50 text-rose-700">
                <UserX className="h-4 w-4" />
              </span>
            </div>
            <p className="tabular-nums mt-2 text-2xl font-bold text-rose-700">{stats.suspended}</p>
          </article>
        </section>

        {/* Filters */}
        <section className={`${SURFACE_TOKENS.panel} flex flex-wrap items-center justify-between gap-3 p-4`}>
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

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            aria-label="Filter by role"
            className="h-9 rounded-full border border-slate-200 bg-slate-50 px-4 text-xs font-semibold text-slate-700 focus:border-sky-300 focus:bg-white focus:outline-none"
          >
            <option value="">All Roles</option>
            <option value="admin">Admin ({stats.admins})</option>
            <option value="manager">Manager ({stats.managers})</option>
            <option value="viewer">Viewer ({stats.viewers})</option>
          </select>
        </section>

        {error ? (
          <div className={BUTTON_TOKENS.alertError} role="alert">
            {error}
          </div>
        ) : null}

        <section className={`${SURFACE_TOKENS.card} overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/70">
                <tr className="text-[11px] font-semibold text-slate-400 uppercase">
                  <th className="px-5 py-3.5">Member</th>
                  <th className="px-5 py-3.5">Email</th>
                  <th className="px-5 py-3.5">Role</th>
                  <th className="px-5 py-3.5">Projects</th>
                  <th className="px-5 py-3.5">Status</th>
                  <PermissionGate permission="users:write">
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </PermissionGate>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {!loaded ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-sm text-slate-500">
                      Loading users...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-sm text-slate-500">
                      No matching users found.
                    </td>
                  </tr>
                ) : (
                  users.map((member) => {
                    const isSelf = member.id === currentUser?.id;
                    const isBusy = busyId === member.id;
                    const isConfirmingDelete = confirmDeleteId === member.id;

                    return (
                      <tr key={member.id} className="hover:bg-slate-50/50">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-50 text-xs font-bold text-sky-800 ring-1 ring-sky-100">
                              {member.name.slice(0, 2).toUpperCase()}
                            </span>
                            <span className="font-semibold text-slate-900">
                              {member.name}
                              {isSelf ? (
                                <span className="ml-1.5 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                                  You
                                </span>
                              ) : null}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-slate-500">{member.email}</td>
                        <td className="px-5 py-3.5">
                          <PermissionGate
                            permission="users:write"
                            fallback={
                              <span
                                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${BADGE_TOKENS.role[member.role]}`}
                              >
                                {member.role}
                              </span>
                            }
                          >
                            <select
                              value={member.role}
                              disabled={isSelf || isBusy}
                              onChange={(e) => void handleRoleChange(member, e.target.value as Role)}
                              aria-label={`Change role for ${member.name}`}
                              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700 capitalize focus:border-sky-300 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              <option value="admin">Admin</option>
                              <option value="manager">Manager</option>
                              <option value="viewer">Viewer</option>
                            </select>
                          </PermissionGate>
                        </td>
                        <td className="tabular-nums px-5 py-3.5 text-xs font-semibold text-slate-600">
                          {member.projectCount ?? 0} assigned
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${BADGE_TOKENS.accountStatus[member.status]}`}
                          >
                            {member.status}
                          </span>
                        </td>
                        <PermissionGate permission="users:write">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center justify-end gap-1.5">
                              {isConfirmingDelete ? (
                                <>
                                  <button
                                    type="button"
                                    disabled={isBusy}
                                    onClick={() => void handleDeleteUser(member)}
                                    className="cursor-pointer rounded-full bg-rose-100 px-2.5 py-1 text-[11px] font-semibold text-rose-800 hover:bg-rose-200"
                                  >
                                    Confirm
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteId(null)}
                                    className="cursor-pointer rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600"
                                  >
                                    Cancel
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    disabled={isSelf || isBusy}
                                    onClick={() => void handleStatusToggle(member)}
                                    className="cursor-pointer rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45"
                                  >
                                    {member.status === 'active' ? 'Suspend' : 'Activate'}
                                  </button>

                                  <button
                                    type="button"
                                    disabled={isBusy}
                                    aria-label={`Edit ${member.name}`}
                                    onClick={() => {
                                      setEditingMember(member);
                                      setModalOpen(true);
                                    }}
                                    className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:bg-sky-50 hover:text-sky-700"
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </button>

                                  <button
                                    type="button"
                                    disabled={isSelf || isBusy}
                                    aria-label={`Delete ${member.name}`}
                                    onClick={() => setConfirmDeleteId(member.id)}
                                    className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-45"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </PermissionGate>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
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
            void reloadDirectory();
          }}
        />
      ) : null}
    </DashboardLayout>
  );
}
