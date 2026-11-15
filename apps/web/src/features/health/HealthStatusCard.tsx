import { useEffect, useState } from 'react';
import { ApiError, apiRequest } from '../../lib/api';
import type { HealthResponse } from '../../types/api';

function getErrorMessage(err: unknown): string {
  return err instanceof ApiError ? err.message : 'Unable to reach API';
}

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
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setError(getErrorMessage(err));
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
      setError(getErrorMessage(err));
      setHealth(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs"
      aria-labelledby="system-status-title"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 id="system-status-title" className="text-base font-semibold text-slate-900">
          API &amp; Database Status
        </h2>
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            health?.ok ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
          }`}
        >
          {loading ? 'Checking...' : health?.ok ? 'Online' : 'Unavailable'}
        </span>
      </div>

      {error ? (
        <p className="mt-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      {health ? (
        <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <dt className="text-xs font-medium tracking-wide text-slate-500 uppercase">Service</dt>
            <dd className="mt-1 text-sm font-semibold text-slate-900">{health.service}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium tracking-wide text-slate-500 uppercase">Database</dt>
            <dd className="mt-1 text-sm font-semibold text-slate-900">{health.db}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium tracking-wide text-slate-500 uppercase">
              Environment
            </dt>
            <dd className="mt-1 text-sm font-semibold text-slate-900">{health.environment}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium tracking-wide text-slate-500 uppercase">
              Checked At
            </dt>
            <dd className="mt-1 text-sm font-semibold text-slate-900">
              {new Date(health.timestamp).toLocaleTimeString()}
            </dd>
          </div>
        </dl>
      ) : null}

      <div className="mt-4">
        <button
          type="button"
          className="inline-flex cursor-pointer items-center rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          onClick={() => void handleRefresh()}
          disabled={loading}
        >
          Refresh Status
        </button>
      </div>
    </section>
  );
}
