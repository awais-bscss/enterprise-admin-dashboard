import { Activity, Download, RefreshCw } from 'lucide-react';
import { ErrorAlertBanner } from '../../components/ErrorAlertBanner';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { PaginationControls } from '../../components/PaginationControls';
import { SearchInput } from '../../components/SearchInput';
import { TableRowsSkeleton } from '../../components/WorkspaceSkeletons';
import { BADGE_TOKENS, BUTTON_TOKENS, SURFACE_TOKENS } from '../../theme/tokens';
import { useAuditLogs } from '../../hooks/useAuditLogs';

export function AuditLogsPage() {
  const {
    logs,
    pagination,
    search,
    setSearch,
    resourceFilter,
    setResourceFilter,
    setPage,
    setLimit,
    loaded,
    refreshing,
    exportingCsv,
    error,
    handleRefresh,
    handleExportVisibleCsv,
  } = useAuditLogs();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-700 ring-1 ring-sky-100 dark:bg-sky-500/15 dark:text-sky-300 dark:ring-sky-500/30">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Security Audit Logs
              </h1>
              <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">
                Live activity trail across sign-ins, workspace updates, and account changes.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={exportingCsv || logs.length === 0}
              onClick={() => void handleExportVisibleCsv()}
              className={BUTTON_TOKENS.secondaryPill}
            >
              <Download className="h-3.5 w-3.5" />
              {exportingCsv ? 'Formatting...' : 'Export CSV'}
            </button>

            <button
              type="button"
              disabled={refreshing}
              onClick={() => void handleRefresh()}
              className={BUTTON_TOKENS.secondaryPill}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        <section
          className={`${SURFACE_TOKENS.panel} flex flex-wrap items-center justify-between gap-3 p-4`}
        >
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'All Events', value: '' },
              { label: 'Auth', value: 'auth' },
              { label: 'Projects', value: 'project' },
              { label: 'Departments', value: 'department' },
              { label: 'Clients', value: 'client' },
              { label: 'Employees', value: 'user' },
              { label: 'Reports', value: 'report' },
            ].map((tab) => (
              <button
                key={tab.label}
                type="button"
                onClick={() => setResourceFilter(tab.value)}
                className={
                  resourceFilter === tab.value
                    ? BUTTON_TOKENS.filterActive
                    : BUTTON_TOKENS.filterIdle
                }
              >
                {tab.label}
              </button>
            ))}
          </div>

          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search events, actors, or actions..."
            ariaLabel="Search audit logs"
          />
        </section>

        {error ? (
          <ErrorAlertBanner
            message={error}
            onRetry={() => void handleRefresh()}
            retrying={refreshing}
          />
        ) : null}

        <section className={`${SURFACE_TOKENS.card} overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-surface-subtle dark:border-slate-800">
                <tr className="text-[11px] font-semibold text-slate-400 uppercase">
                  <th className="px-5 py-3.5">Event</th>
                  <th className="px-5 py-3.5">Summary</th>
                  <th className="px-5 py-3.5">Actor</th>
                  <th className="px-5 py-3.5">Timestamp</th>
                </tr>
              </thead>
              <tbody
                className={`divide-y divide-slate-100 transition-opacity dark:divide-slate-800 ${
                  refreshing && loaded ? 'opacity-60' : ''
                }`}
              >
                {!loaded ? (
                  <TableRowsSkeleton columns={4} ariaLabel="Loading audit logs" />
                ) : logs.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-5 py-8 text-center text-sm text-slate-500 dark:text-slate-400"
                    >
                      No audit events match this filter.
                    </td>
                  </tr>
                ) : (
                  logs.map((entry) => (
                    <tr key={entry.id} className="hover:bg-surface-subtle/60">
                      <td className="px-5 py-3.5">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${BADGE_TOKENS.auditResource[entry.resourceType]}`}
                        >
                          {entry.action}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-800 dark:text-slate-100">
                        {entry.summary}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-500 dark:text-slate-400">
                        <span className="font-semibold text-slate-700 dark:text-slate-200">
                          {entry.actorName}
                        </span>{' '}
                        ({entry.actorRole})
                      </td>
                      <td className="tabular-nums px-5 py-3.5 text-xs text-slate-400">
                        {new Date(entry.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <PaginationControls
          pagination={pagination}
          itemLabel="audit events"
          limitOptions={[12, 25, 50]}
          isFetching={refreshing}
          onPageChange={setPage}
          onLimitChange={setLimit}
        />
      </div>
    </DashboardLayout>
  );
}
