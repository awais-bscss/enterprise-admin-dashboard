import { useEffect, useState } from 'react';
import { CheckCircle2, Download, FileJson, FileSpreadsheet } from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { getErrorMessage, isAbortError } from '../../lib/errors';
import { BUTTON_TOKENS, SURFACE_TOKENS } from '../../theme/tokens';
import type { DashboardOverviewData } from '../../types/auth';
import { getDashboardOverview } from '../dashboard/dashboardApi';
import { downloadCsvReport, downloadJsonReport } from './workspaceApi';

export function ReportsPage() {
  const [overview, setOverview] = useState<DashboardOverviewData | null>(null);
  const [exporting, setExporting] = useState<'csv' | 'json' | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    getDashboardOverview(controller.signal)
      .then((data) => {
        setOverview(data);
        setError(null);
      })
      .catch((err: unknown) => {
        if (isAbortError(err)) return;
        setError(getErrorMessage(err, 'Unable to load report metrics.'));
      });

    return () => controller.abort();
  }, []);

  async function handleExportCsv() {
    setExporting('csv');
    setNotice(null);
    setError(null);
    try {
      await downloadCsvReport();
      setNotice('Downloaded CSV report and recorded export in security audit log.');
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to export CSV report.'));
    } finally {
      setExporting(null);
    }
  }

  async function handleExportJson() {
    setExporting('json');
    setNotice(null);
    setError(null);
    try {
      await downloadJsonReport();
      setNotice('Downloaded JSON report and recorded export in security audit log.');
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to export JSON report.'));
    } finally {
      setExporting(null);
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50 text-rose-700 ring-1 ring-rose-100">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Compliance Reports
              </h1>
              <p className="mt-0.5 text-sm text-slate-500">
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
              <FileJson className="h-4 w-4 text-sky-600" />
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

        {notice ? (
          <div
            className={`flex items-center gap-2 ${BUTTON_TOKENS.alertSuccess}`}
            role="status"
          >
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>{notice}</span>
          </div>
        ) : null}

        {error ? (
          <div className={BUTTON_TOKENS.alertError} role="alert">
            {error}
          </div>
        ) : null}

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <article className={`${SURFACE_TOKENS.panel} p-5`}>
            <p className="text-xs font-medium text-slate-400 uppercase">Total Projects</p>
            <p className="tabular-nums mt-2 text-3xl font-bold text-slate-900">
              {overview ? overview.stats.totalProjects : '...'}
            </p>
          </article>
          <article className={`${SURFACE_TOKENS.panel} p-5`}>
            <p className="text-xs font-medium text-slate-400 uppercase">Completed Projects</p>
            <p className="tabular-nums mt-2 text-3xl font-bold text-emerald-700">
              {overview ? overview.stats.completedProjects : '...'}
            </p>
          </article>
          <article className={`${SURFACE_TOKENS.panel} p-5`}>
            <p className="text-xs font-medium text-slate-400 uppercase">Directory Users</p>
            <p className="tabular-nums mt-2 text-3xl font-bold text-slate-900">
              {overview ? overview.stats.totalUsers : '...'}
            </p>
          </article>
          <article className={`${SURFACE_TOKENS.panel} p-5`}>
            <p className="text-xs font-medium text-slate-400 uppercase">Completion Average</p>
            <p className="tabular-nums mt-2 text-3xl font-bold text-sky-700">
              {overview ? `${overview.stats.averageProgress}%` : '...'}
            </p>
          </article>
        </section>
      </div>
    </DashboardLayout>
  );
}
