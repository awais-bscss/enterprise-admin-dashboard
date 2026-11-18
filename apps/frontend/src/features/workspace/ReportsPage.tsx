import { Download, FileJson, FileSpreadsheet } from 'lucide-react';
import { ErrorAlertBanner } from '../../components/ErrorAlertBanner';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { MetricCardsSkeleton } from '../../components/WorkspaceSkeletons';
import { BUTTON_TOKENS, SURFACE_TOKENS } from '../../theme/tokens';
import { useReportsWorkspace } from '../../hooks/useReportsWorkspace';

export function ReportsPage() {
  const {
    overview,
    exporting,
    retrying,
    error,
    handleExportCsv,
    handleExportJson,
    handleRetry,
  } = useReportsWorkspace();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50 text-rose-700 ring-1 ring-rose-100 dark:bg-rose-500/15 dark:text-rose-300 dark:ring-rose-500/30">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Compliance Reports
              </h1>
              <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">
                Export live project progress and directory governance snapshots.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              disabled={exporting !== null}
              onClick={() => void handleExportJson()}
              className={BUTTON_TOKENS.secondaryPill}
            >
              <FileJson className="h-4 w-4 text-sky-600 dark:text-sky-400" />
              {exporting === 'json' ? 'Exporting...' : 'Export JSON'}
            </button>

            <button
              type="button"
              disabled={exporting !== null}
              onClick={() => void handleExportCsv()}
              className={BUTTON_TOKENS.primarySoftPill}
            >
              <Download className="h-4 w-4" />
              {exporting === 'csv' ? 'Exporting...' : 'Download CSV'}
            </button>
          </div>
        </div>

        {error ? (
          <ErrorAlertBanner
            message={error}
            onRetry={() => void handleRetry()}
            retrying={retrying}
          />
        ) : null}

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {!overview && !error ? (
            <MetricCardsSkeleton count={4} />
          ) : (
            <>
              <article className={`${SURFACE_TOKENS.panel} p-5`}>
                <p className="text-xs font-medium text-slate-500 uppercase dark:text-slate-400">
                  Total Projects
                </p>
                <p className="tabular-nums mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100">
                  {overview ? overview.stats.totalProjects : '--'}
                </p>
              </article>
              <article className={`${SURFACE_TOKENS.panel} p-5`}>
                <p className="text-xs font-medium text-slate-500 uppercase dark:text-slate-400">
                  Completed Projects
                </p>
                <p className="tabular-nums mt-2 text-3xl font-bold text-emerald-700 dark:text-emerald-300">
                  {overview ? overview.stats.completedProjects : '--'}
                </p>
              </article>
              <article className={`${SURFACE_TOKENS.panel} p-5`}>
                <p className="text-xs font-medium text-slate-500 uppercase dark:text-slate-400">
                  Total Employees
                </p>
                <p className="tabular-nums mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100">
                  {overview ? overview.stats.totalUsers : '--'}
                </p>
              </article>
              <article className={`${SURFACE_TOKENS.panel} p-5`}>
                <p className="text-xs font-medium text-slate-500 uppercase dark:text-slate-400">
                  Completion Average
                </p>
                <p className="tabular-nums mt-2 text-3xl font-bold text-sky-700 dark:text-sky-300">
                  {overview ? `${overview.stats.averageProgress}%` : '--'}
                </p>
              </article>
            </>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
