import { useState } from 'react';
import { Briefcase, Pencil, Plus, Trash2 } from 'lucide-react';
import { ConfirmDeleteModal } from '../../components/ConfirmDeleteModal';
import { ErrorAlertBanner } from '../../components/ErrorAlertBanner';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { LinkedCountPill } from '../../components/LinkedCountPill';
import { PaginationControls } from '../../components/PaginationControls';
import { SearchInput } from '../../components/SearchInput';
import { StatusSummaryCards } from '../../components/StatusSummaryCards';
import { TableRowsSkeleton } from '../../components/WorkspaceSkeletons';
import { useClientsWorkspace } from '../../hooks/useClientsWorkspace';
import { getInitials } from '../../lib/formatters';
import { BADGE_TOKENS, BUTTON_TOKENS, SURFACE_TOKENS } from '../../theme/tokens';
import type { ClientItem } from '../../types/auth';
import { useAuth } from '../auth/authContext';
import { PermissionGate } from '../auth/PermissionGate';
import { ClientFormModal } from './ClientFormModal';

export function ClientsPage() {
  const { user: currentUser } = useAuth();
  const {
    items: clients,
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
  } = useClientsWorkspace();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientItem | null>(null);
  const [deletingClient, setDeletingClient] = useState<ClientItem | null>(null);
  const canWrite = Boolean(currentUser?.permissions.includes('clients:write'));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100 dark:bg-cyan-500/15 dark:text-cyan-300 dark:ring-cyan-500/30">
              <Briefcase className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Clients
              </h1>
              <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">
                Manage client accounts, primary contacts, and status.
              </p>
            </div>
          </div>

          <PermissionGate permission="clients:write">
            <button
              type="button"
              onClick={() => {
                setEditingClient(null);
                setModalOpen(true);
              }}
              className={`${BUTTON_TOKENS.primarySoftPill} py-2.5`}
            >
              <Plus className="h-4 w-4" />
              Add Client
            </button>
          </PermissionGate>
        </div>

        <StatusSummaryCards
          totalLabel="Total Clients"
          stats={stats}
          icon={Briefcase}
          ariaLabel="Client summary stats"
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
            placeholder="Search clients, companies, or emails..."
            ariaLabel="Search clients"
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
                  <th className="px-5 py-3.5">Client</th>
                  <th className="px-5 py-3.5">Company</th>
                  <th className="px-5 py-3.5">Email</th>
                  <th className="px-5 py-3.5">Phone</th>
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
                    ariaLabel="Loading clients"
                    showAvatar
                  />
                ) : clients.length === 0 ? (
                  <tr>
                    <td
                      colSpan={canWrite ? 7 : 6}
                      className="px-5 py-10 text-center text-sm text-slate-500 dark:text-slate-400"
                    >
                      No matching clients found.
                    </td>
                  </tr>
                ) : (
                  clients.map((client) => {
                    const isBusy = busyId === client.id;
                    return (
                      <tr key={client.id} className="hover:bg-surface-subtle/60">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-50 text-xs font-bold text-cyan-800 ring-1 ring-cyan-100 dark:bg-cyan-500/15 dark:text-cyan-300 dark:ring-cyan-500/30">
                              {getInitials(client.name)}
                            </span>
                            <span className="font-semibold text-slate-900 dark:text-slate-100">
                              {client.name}
                            </span>
                          </div>
                        </td>

                        <td className="px-5 py-3.5 font-medium text-slate-700 dark:text-slate-200">
                          {client.company}
                        </td>

                        <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">
                          {client.email}
                        </td>

                        <td className="tabular-nums px-5 py-3.5 text-xs text-slate-500 dark:text-slate-400">
                          {client.phone || '--'}
                        </td>

                        <td className="px-5 py-3.5">
                          <LinkedCountPill
                            count={client.projectCount ?? 0}
                            singular="project"
                            plural="projects"
                            to={`/projects?clientId=${client.id}`}
                            title={`View projects for ${client.company}`}
                          />
                        </td>

                        <td className="px-5 py-3.5">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${BADGE_TOKENS.entityStatus[client.status]}`}
                          >
                            {client.status}
                          </span>
                        </td>

                        {canWrite ? (
                          <td className="px-5 py-3.5">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => void handleStatusToggle(client)}
                                className="cursor-pointer rounded-full border border-slate-200 bg-surface px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                              >
                                {client.status === 'active' ? 'Deactivate' : 'Activate'}
                              </button>

                              <button
                                type="button"
                                disabled={isBusy}
                                aria-label={`Edit ${client.name}`}
                                onClick={() => {
                                  setEditingClient(client);
                                  setModalOpen(true);
                                }}
                                className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-surface text-slate-500 transition hover:bg-sky-50 hover:text-sky-700 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-sky-500/20 dark:hover:text-sky-300"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>

                              <button
                                type="button"
                                disabled={isBusy}
                                aria-label={`Delete ${client.name}`}
                                onClick={() => setDeletingClient(client)}
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
          itemLabel="clients"
          limitOptions={[10, 20, 50]}
          isFetching={isFetching}
          onPageChange={setPage}
          onLimitChange={setLimit}
        />
      </div>

      {modalOpen ? (
        <ClientFormModal
          client={editingClient}
          onClose={() => {
            setModalOpen(false);
            setEditingClient(null);
          }}
          onSaved={() => {
            setModalOpen(false);
            setEditingClient(null);
          }}
        />
      ) : null}

      {deletingClient ? (
        <ConfirmDeleteModal
          title="Delete Client"
          itemName={`${deletingClient.name} (${deletingClient.company})`}
          description="This client record will be permanently removed from the workspace. This action cannot be undone."
          confirmLabel="Delete Client"
          deleting={busyId === deletingClient.id}
          onCancel={() => setDeletingClient(null)}
          onConfirm={async () => {
            await handleDelete(deletingClient);
            setDeletingClient(null);
          }}
        />
      ) : null}
    </DashboardLayout>
  );
}
