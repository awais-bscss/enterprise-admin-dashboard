import { useEffect, useState } from 'react';
import { Clock, Database, RefreshCw, Server, Sparkles } from 'lucide-react';
import { apiRequest } from '../../lib/api';
import { getErrorMessage, isAbortError } from '../../lib/errors';
import { SURFACE_TOKENS } from '../../theme/tokens';
import type { HealthResponse } from '../../types/api';

export function HealthStatusCard() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    apiRequest<HealthResponse>('/health', { skipAuth: true, signal: controller.signal })
      .then((data) => {
        setHealth(data);
        setError(null);
      })
      .catch((err: unknown) => {
        if (isAbortError(err)) return;
        setError(getErrorMessage(err, 'Unable to reach API'));
        setHealth(null);
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, []);

  async function handleRefresh() {
    setLoading(true);
    setError(null);

    try {
      const data = await apiRequest<HealthResponse>('/health', { skipAuth: true });
      setHealth(data);
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to reach API'));
      setHealth(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className={`${SURFACE_TOKENS.card} p-5`} aria-labelledby="system-status-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
            <Server className="h-4 w-4" />
          </div>
          <div>
            <h2 id="system-status-title" className="text-base font-semibold text-slate-900">
              API &amp; Database Status
            </h2>
            <p className="text-xs text-slate-400">Live gateway connectivity check</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
              health?.ok
                ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/70'
                : 'bg-rose-50 text-rose-700 ring-1 ring-rose-200/70'
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                health?.ok ? 'bg-emerald-500' : 'bg-rose-500'
              }`}
            />
            {loading ? 'Checking...' : health?.ok ? 'Online' : 'Unavailable'}
          </span>

          <button
            type="button"
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-slate-200/80 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
            onClick={() => void handleRefresh()}
            disabled={loading}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh Status
          </button>
        </div>
      </div>

      {error ? (
        <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700" role="alert">
          {error}
        </p>
      ) : null}

      {health ? (
        <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl bg-slate-50/80 p-3">
            <dt className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 uppercase">
              <Server className="h-3.5 w-3.5 text-sky-500" />
              Service
            </dt>
            <dd className="mt-1 truncate text-sm font-semibold text-slate-800">{health.service}</dd>
          </div>
          <div className="rounded-2xl bg-slate-50/80 p-3">
            <dt className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 uppercase">
              <Database className="h-3.5 w-3.5 text-emerald-500" />
              Database
            </dt>
            <dd className="mt-1 text-sm font-semibold text-slate-800 capitalize">{health.db}</dd>
          </div>
          <div className="rounded-2xl bg-slate-50/80 p-3">
            <dt className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 uppercase">
              <Sparkles className="h-3.5 w-3.5 text-rose-400" />
              Environment
            </dt>
            <dd className="mt-1 text-sm font-semibold text-slate-800 capitalize">
              {health.environment}
            </dd>
          </div>
          <div className="rounded-2xl bg-slate-50/80 p-3">
            <dt className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 uppercase">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              Checked At
            </dt>
            <dd className="tabular-nums mt-1 text-sm font-semibold text-slate-800">
              {new Date(health.timestamp).toLocaleTimeString()}
            </dd>
          </div>
        </dl>
      ) : null}
    </section>
  );
}
