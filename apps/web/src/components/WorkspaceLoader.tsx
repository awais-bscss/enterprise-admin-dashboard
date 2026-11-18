import { LoaderCircle } from 'lucide-react';
import { SURFACE_TOKENS } from '../theme/tokens';
import { DashboardChartsSkeleton, MetricCardsSkeleton } from './WorkspaceSkeletons';

export function WorkspaceLoader() {
  return (
    <div
      className={`flex min-h-screen w-full ${SURFACE_TOKENS.canvas}`}
      aria-busy="true"
      aria-live="polite"
    >
      <aside
        aria-hidden="true"
        className="hidden w-64 shrink-0 flex-col justify-between border-r border-slate-200/70 bg-surface p-5 lg:flex dark:border-slate-800"
      >
        <div className="space-y-6 animate-pulse">
          <div className="flex items-center gap-2.5 px-1">
            <div className="h-10 w-10 rounded-lg bg-slate-200/80 dark:bg-slate-700/70" />
            <div className="space-y-1.5">
              <div className="h-3.5 w-16 rounded bg-slate-200/80 dark:bg-slate-700/70" />
              <div className="h-2.5 w-24 rounded bg-slate-200/80 dark:bg-slate-700/70" />
            </div>
          </div>

          <div className="space-y-2.5 pt-2">
            {Array.from({ length: 7 }, (_, idx) => (
              <div key={idx} className="h-9 w-full rounded-2xl bg-slate-100 dark:bg-slate-800/80" />
            ))}
          </div>
        </div>

        <div className="h-9 w-full animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800/80" />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col bg-canvas">
        <header className="flex items-center justify-between border-b border-slate-200/70 bg-surface/90 px-4 py-3.5 sm:px-7 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <LoaderCircle className="h-4 w-4 animate-spin text-sky-600 dark:text-sky-400" />
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Loading workspace...
            </span>
          </div>
          <div className="flex items-center gap-2.5 animate-pulse">
            <div className="h-9 w-9 rounded-full bg-slate-200/80 dark:bg-slate-700/70" />
            <div className="h-9 w-28 rounded-full bg-slate-200/80 dark:bg-slate-700/70" />
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1440px] flex-1 space-y-6 p-4 sm:p-7">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCardsSkeleton count={4} />
          </div>
          <DashboardChartsSkeleton />
        </main>
      </div>
    </div>
  );
}
