import { useCallback, useEffect, useState } from 'react';
import { Activity, RefreshCw } from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { getErrorMessage, isAbortError } from '../../lib/errors';
import { BADGE_TOKENS, BUTTON_TOKENS, SURFACE_TOKENS } from '../../theme/tokens';
import type { AuditLogItem } from '../../types/auth';
import { listAuditLogs } from './workspaceApi';

export function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [resourceFilter, setResourceFilter] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadLogs = useCallback(async (resource: string, signal?: AbortSignal) => {
    return listAuditLogs({ resourceType: resource, signal });
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadLogs(resourceFilter, controller.signal)
      .then((items) => {
        setLogs(items);
        setError(null);
        setLoaded(true);
      })
      .catch((err: unknown) => {
        if (isAbortError(err)) return;
        setError(getErrorMessage(err, 'Unable to load audit logs.'));
        setLoaded(true);
      });

    return () => controller.abort();
  }, [loadLogs, resourceFilter]);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      const items = await loadLogs(resourceFilter);
      setLogs(items);
      setError(null);
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to refresh audit logs.'));
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-700 ring-1 ring-sky-100">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Security Audit Logs
              </h1>
              <p className="mt-0.5 text-sm text-slate-500">
                Live activity trail across sign-ins, project updates, and account changes.
              </p>
            </div>
          </div>

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

        <div className="flex flex-wrap gap-2">
          {[
            { label: 'All Events', value: '' },
            { label: 'Auth', value: 'auth' },
            { label: 'Projects', value: 'project' },
            { label: 'Users', value: 'user' },
            { label: 'Reports', value: 'report' },
            { label: 'Settings', value: 'settings' },
          ].map((tab) => (
            <button
              key={tab.label}
              type="button"
              onClick={() => setResourceFilter(tab.value)}
              className={
                resourceFilter === tab.value
                  ? BUTTON_TOKENS.filterActive
                  : 'cursor-pointer rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-600 ring-1 ring-slate-200/70 transition hover:bg-slate-50'
              }
            >
              {tab.label}
            </button>
          ))}
        </div>

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
                  <th className="px-5 py-3.5">Event</th>
                  <th className="px-5 py-3.5">Summary</th>
                  <th className="px-5 py-3.5">Actor</th>
                  <th className="px-5 py-3.5">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {!loaded ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-sm text-slate-500">
                      Loading audit logs...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-sm text-slate-500">
                      No audit events recorded yet.
                    </td>
                  </tr>
                ) : (
                  logs.map((entry) => (
                    <tr key={entry.id} className="hover:bg-slate-50/50">
                      <td className="px-5 py-3.5">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${BADGE_TOKENS.auditResource[entry.resourceType]}`}
                        >
                          {entry.action}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-800">{entry.summary}</td>
                      <td className="px-5 py-3.5 text-xs text-slate-500">
                        <span className="font-semibold text-slate-700">{entry.actorName}</span> (
                        {entry.actorRole})
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
      </div>
    </DashboardLayout>
  );
}
