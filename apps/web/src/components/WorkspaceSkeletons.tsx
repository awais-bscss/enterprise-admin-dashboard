import { SURFACE_TOKENS } from '../theme/tokens';

export function ProjectsGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <section
      className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3"
      aria-busy="true"
      aria-label="Loading projects"
    >
      {Array.from({ length: count }, (_, idx) => (
        <div
          key={idx}
          className={`${SURFACE_TOKENS.card} flex animate-pulse flex-col justify-between p-5`}
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="h-5 w-20 rounded-full bg-slate-200/80 dark:bg-slate-700/70" />
              <span className="h-5 w-20 rounded-full bg-slate-200/80 dark:bg-slate-700/70" />
            </div>
            <div className="mt-4 h-5 w-2/3 rounded-lg bg-slate-200/80 dark:bg-slate-700/70" />
            <div className="mt-2 h-8 w-full rounded-lg bg-slate-100 dark:bg-slate-800/80" />
            <div className="mt-4 h-14 w-full rounded-2xl bg-slate-100 dark:bg-slate-800/80" />
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3.5 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="h-7 w-7 rounded-full bg-slate-200/80 dark:bg-slate-700/70" />
              <span className="h-4 w-24 rounded bg-slate-200/80 dark:bg-slate-700/70" />
            </div>
            <span className="h-6 w-16 rounded-full bg-slate-100 dark:bg-slate-800" />
          </div>
        </div>
      ))}
    </section>
  );
}

export function TableRowsSkeleton({ columns, rows = 5 }: { columns: number; rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }, (_, rowIndex) => (
        <tr key={rowIndex} aria-hidden="true" className="animate-pulse">
          {Array.from({ length: columns }, (_, colIndex) => (
            <td key={colIndex} className="px-5 py-4">
              <div
                className={`h-4 rounded bg-slate-200/80 dark:bg-slate-700/70 ${
                  colIndex === 0 ? 'w-32' : colIndex === columns - 1 ? 'ml-auto w-20' : 'w-24'
                }`}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function MetricCardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, idx) => (
        <article
          key={idx}
          aria-hidden="true"
          className={`${SURFACE_TOKENS.panel} animate-pulse p-5`}
        >
          <div className="h-3 w-24 rounded bg-slate-200/80 dark:bg-slate-700/70" />
          <div className="mt-3 h-8 w-16 rounded-lg bg-slate-200/80 dark:bg-slate-700/70" />
        </article>
      ))}
    </>
  );
}

export function DashboardChartsSkeleton() {
  return (
    <section
      className="grid grid-cols-1 gap-5 lg:grid-cols-3"
      aria-busy="true"
      aria-label="Loading analytics charts"
    >
      {Array.from({ length: 3 }, (_, idx) => (
        <article
          key={idx}
          className={`${SURFACE_TOKENS.card} flex min-h-[348px] animate-pulse flex-col justify-between p-5`}
        >
          <div className="space-y-2.5">
            <div className="h-4 w-32 rounded bg-slate-200/80 dark:bg-slate-700/70" />
            <div className="h-7 w-20 rounded-lg bg-slate-200/80 dark:bg-slate-700/70" />
          </div>
          <div className="my-4 h-44 w-full rounded-2xl bg-slate-100 dark:bg-slate-800/80" />
          <div className="h-4 w-2/3 rounded bg-slate-200/80 dark:bg-slate-700/70" />
        </article>
      ))}
    </section>
  );
}
