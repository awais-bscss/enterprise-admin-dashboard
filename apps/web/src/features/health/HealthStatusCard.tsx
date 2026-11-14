import { useEffect, useState } from 'react';
import { ApiError, apiRequest } from '../../lib/api';
import type { HealthResponse } from '../../types/api';

function fetchHealthStatus(withCookieProbe: boolean, signal?: AbortSignal) {
  const endpoint = withCookieProbe ? '/health?setTestCookie=1' : '/health';
  return apiRequest<HealthResponse>(endpoint, { signal });
}

function getErrorMessage(err: unknown): string {
  return err instanceof ApiError ? err.message : 'Unable to reach API';
}

export function HealthStatusCard() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    fetchHealthStatus(false, controller.signal)
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

  async function handleCheck(withCookieProbe: boolean) {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchHealthStatus(withCookieProbe);
      setHealth(data);
    } catch (err) {
      setError(getErrorMessage(err));
      setHealth(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="card" aria-labelledby="system-status-title">
      <div className="card-header">
        <h2 id="system-status-title">API &amp; Database Status</h2>
        <span className={`badge ${health?.ok ? 'badge-ok' : 'badge-warn'}`}>
          {loading ? 'Checking...' : health?.ok ? 'Online' : 'Unavailable'}
        </span>
      </div>

      {error ? (
        <p className="error-text" role="alert">
          {error}
        </p>
      ) : null}

      {health ? (
        <dl className="status-grid">
          <div>
            <dt>Service</dt>
            <dd>{health.service}</dd>
          </div>
          <div>
            <dt>Database</dt>
            <dd>{health.db}</dd>
          </div>
          <div>
            <dt>Environment</dt>
            <dd>{health.environment}</dd>
          </div>
          <div>
            <dt>Checked At</dt>
            <dd>{new Date(health.timestamp).toLocaleTimeString()}</dd>
          </div>
        </dl>
      ) : null}

      {health?.probeCookieSet ? (
        <p className="muted">Probe cookie requested. Verify proxy_probe under Application Cookies.</p>
      ) : null}

      <div className="actions">
        <button type="button" className="btn" onClick={() => void handleCheck(false)} disabled={loading}>
          Refresh
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => void handleCheck(true)}
          disabled={loading}
        >
          Test Proxy Cookie
        </button>
      </div>
    </section>
  );
}
