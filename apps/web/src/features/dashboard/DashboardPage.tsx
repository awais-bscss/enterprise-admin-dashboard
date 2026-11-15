import { useEffect, useState } from 'react';
import { ApiError, apiRequest } from '../../lib/api';
import type { ApiSuccessResponse } from '../../types/api';
import type { DashboardOverviewData, Permission } from '../../types/auth';
import { useAuth } from '../auth/authContext';
import { PermissionGate } from '../auth/PermissionGate';
import { HealthStatusCard } from '../health/HealthStatusCard';

interface ModuleCardConfig {
  permission: Permission;
  title: string;
  grantedText: string;
  deniedText: string;
}

const RBAC_MODULES: readonly ModuleCardConfig[] = [
  {
    permission: 'users:write',
    title: 'User Administration',
    grantedText: 'Full access to invite, update roles, and suspend accounts.',
    deniedText: 'Requires users:write permission (Admin only).',
  },
  {
    permission: 'audit:read',
    title: 'Security Audit Logs',
    grantedText: 'Access granted to inspect active sessions and activity trails.',
    deniedText: 'Requires audit:read permission (Admin or Manager).',
  },
  {
    permission: 'reports:export',
    title: 'Compliance Exports',
    grantedText: 'Access granted to generate and download operational reports.',
    deniedText: 'Requires reports:export permission (Admin or Manager).',
  },
  {
    permission: 'settings:manage',
    title: 'System Security Settings',
    grantedText: 'Access granted to configure organization-wide policies.',
    deniedText: 'Requires settings:manage permission (Admin only).',
  },
];

export function DashboardPage() {
  const { user, logout, expiresAt } = useAuth();
  const [overview, setOverview] = useState<DashboardOverviewData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    apiRequest<ApiSuccessResponse<DashboardOverviewData>>('/dashboard/overview', {
      signal: controller.signal,
    })
      .then((res) => {
        setOverview(res.data);
        setError(null);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setError(err instanceof ApiError ? err.message : 'Unable to load overview');
      });

    return () => controller.abort();
  }, []);

  async function handleLogout() {
    setSigningOut(true);
    try {
      await logout();
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900">
      <div className="mx-auto max-w-5xl space-y-5">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div>
            <p className="text-xs font-bold tracking-wider text-blue-700 uppercase">
              Enterprise Administration
            </p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">Welcome, {user?.name}</h1>
            <p className="mt-1 text-sm text-slate-600">
              {user?.email} &middot; Role:{' '}
              <span className="font-semibold text-slate-900 uppercase">{user?.role}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {expiresAt ? (
              <span className="text-xs text-slate-500">
                Token refresh before {new Date(expiresAt).toLocaleTimeString()}
              </span>
            ) : null}
            <button
              type="button"
              className="cursor-pointer rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={() => void handleLogout()}
              disabled={signingOut}
            >
              {signingOut ? 'Signing out...' : 'Sign out'}
            </button>
          </div>
        </header>

        {error ? (
          <div
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            role="alert"
          >
            {error}
          </div>
        ) : null}

        <section
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs"
          aria-labelledby="overview-heading"
        >
          <h2 id="overview-heading" className="text-base font-semibold text-slate-900">
            Workspace Overview
          </h2>

          <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-lg bg-slate-50 p-3.5">
              <dt className="text-xs font-medium tracking-wide text-slate-500 uppercase">
                Total Users
              </dt>
              <dd className="mt-1 text-2xl font-bold text-slate-900">
                {overview ? overview.stats.totalUsers : '...'}
              </dd>
            </div>
            <div className="rounded-lg bg-slate-50 p-3.5">
              <dt className="text-xs font-medium tracking-wide text-slate-500 uppercase">
                Active Users
              </dt>
              <dd className="mt-1 text-2xl font-bold text-slate-900">
                {overview ? overview.stats.activeUsers : '...'}
              </dd>
            </div>
            <div className="rounded-lg bg-slate-50 p-3.5">
              <dt className="text-xs font-medium tracking-wide text-slate-500 uppercase">
                Active Sessions
              </dt>
              <dd className="mt-1 text-2xl font-bold text-slate-900">
                {overview
                  ? overview.stats.activeSessions === null
                    ? 'Restricted'
                    : overview.stats.activeSessions
                  : '...'}
              </dd>
            </div>
          </dl>

          <div className="mt-4 flex flex-wrap gap-2" aria-label="Assigned permissions">
            {user?.permissions.map((perm) => (
              <span
                key={perm}
                className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-800"
              >
                {perm}
              </span>
            ))}
          </div>
        </section>

        <section
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
          aria-label="Role-based module access"
        >
          {RBAC_MODULES.map((mod) => (
            <PermissionGate
              key={mod.permission}
              permission={mod.permission}
              fallback={
                <article className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
                  <h3 className="text-sm font-semibold text-slate-700">{mod.title}</h3>
                  <p className="mt-1 text-xs text-slate-500">{mod.deniedText}</p>
                </article>
              }
            >
              <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
                <h3 className="text-sm font-semibold text-slate-900">{mod.title}</h3>
                <p className="mt-1 text-xs text-slate-600">{mod.grantedText}</p>
              </article>
            </PermissionGate>
          ))}
        </section>

        <HealthStatusCard />
      </div>
    </main>
  );
}
