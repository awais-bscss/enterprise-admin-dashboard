import { SURFACE_TOKENS } from '../theme/tokens';

const SK = 'rounded bg-slate-200/80 dark:bg-slate-700/70';
const SK_PILL = 'rounded-full bg-slate-200/80 dark:bg-slate-700/70';

export type ChartSkeletonVariant = 'bar' | 'donut' | 'trend';

const BAR_HEIGHTS = ['h-12', 'h-24', 'h-20', 'h-32', 'h-16', 'h-28', 'h-24', 'h-14'] as const;
const MIDDLE_CELL_WIDTHS = ['w-24', 'w-20', 'w-28', 'w-16'] as const;

interface TableRowsSkeletonProps {
  columns: number;
  rows?: number;
  ariaLabel?: string;
  showAvatar?: boolean;
}

export function TableRowsSkeleton({
  columns,
  rows = 5,
  ariaLabel,
  showAvatar = false,
}: TableRowsSkeletonProps) {
  return (
    <>
      {Array.from({ length: rows }, (_, rowIndex) => (
        <tr
          key={rowIndex}
          aria-hidden={rowIndex > 0 || !ariaLabel ? true : undefined}
          aria-busy={rowIndex === 0 && ariaLabel ? true : undefined}
          aria-label={rowIndex === 0 ? ariaLabel : undefined}
          className="animate-pulse"
        >
          {Array.from({ length: columns }, (_, colIndex) => {
            if (colIndex === 0) {
              return (
                <td key={colIndex} className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    {showAvatar ? <div className={`h-8 w-8 shrink-0 ${SK_PILL}`} /> : null}
                    <div className="space-y-1.5">
                      <div className={`h-3.5 w-32 ${SK}`} />
                      <div className={`h-2.5 w-24 ${SK}`} />
                    </div>
                  </div>
                </td>
              );
            }

            if (colIndex === columns - 1) {
              return (
                <td key={colIndex} className="px-5 py-4">
                  <div className={`ml-auto h-6 w-16 ${SK_PILL}`} />
                </td>
              );
            }

            const widthClass = MIDDLE_CELL_WIDTHS[(rowIndex + colIndex) % MIDDLE_CELL_WIDTHS.length];
            return (
              <td key={colIndex} className="px-5 py-4">
                <div className={`h-3.5 ${widthClass} ${SK}`} />
              </td>
            );
          })}
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
          <div className="flex items-center justify-between">
            <div className={`h-3 w-24 ${SK}`} />
            <div className={`h-7 w-7 ${SK_PILL}`} />
          </div>
          <div className={`mt-3 h-8 w-16 rounded-lg ${SK}`} />
        </article>
      ))}
    </>
  );
}

interface ChartSkeletonCardProps {
  variant: ChartSkeletonVariant;
  ariaLabel?: string;
}

export function ChartSkeletonCard({ variant, ariaLabel }: ChartSkeletonCardProps) {
  return (
    <article
      aria-busy={ariaLabel ? 'true' : undefined}
      aria-label={ariaLabel}
      aria-hidden={ariaLabel ? undefined : true}
      className={`${SURFACE_TOKENS.card} flex min-h-[396px] animate-pulse flex-col justify-between p-5`}
    >
      {variant === 'bar' ? (
        <>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2.5">
              <div className={`h-4 w-36 ${SK}`} />
              <div className={`h-9 w-20 rounded-lg ${SK}`} />
              <div className={`h-3 w-40 ${SK}`} />
            </div>

            <div className="min-h-[108px] space-y-2.5">
              {Array.from({ length: 3 }, (_, idx) => (
                <div key={idx} className="flex items-center gap-2.5">
                  <div className={`h-7 w-7 ${SK_PILL}`} />
                  <div className="space-y-1">
                    <div className={`h-2.5 w-14 ${SK}`} />
                    <div className={`h-3 w-8 ${SK}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 flex h-48 items-end justify-between gap-3 px-2 pt-6">
            {BAR_HEIGHTS.map((heightClass, idx) => (
              <div key={idx} className="flex flex-1 flex-col items-center gap-2">
                <div className={`w-full rounded-xl ${heightClass} ${SK}`} />
                <div className={`h-2.5 w-8 ${SK}`} />
              </div>
            ))}
          </div>
        </>
      ) : null}

      {variant === 'donut' ? (
        <>
          <div className="flex items-center justify-between gap-3">
            <div className={`h-4 w-32 ${SK}`} />
            <div className={`h-8 w-16 ${SK_PILL}`} />
          </div>

          <div className="my-2 flex h-44 items-center justify-center">
            <div className="flex h-36 w-36 items-center justify-center rounded-full border-[18px] border-slate-200/80 dark:border-slate-700/70">
              <div className="flex flex-col items-center gap-1.5">
                <div className={`h-6 w-8 ${SK}`} />
                <div className={`h-2.5 w-12 ${SK}`} />
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-1">
            {Array.from({ length: 3 }, (_, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className={`h-3 w-20 ${SK}`} />
                  <div className={`h-3 w-10 ${SK}`} />
                </div>
                <div className={`h-2 w-full ${SK_PILL}`} />
              </div>
            ))}
          </div>
        </>
      ) : null}

      {variant === 'trend' ? (
        <>
          <div className="flex items-center justify-between gap-3">
            <div className={`h-4 w-28 ${SK}`} />
            <div className={`h-8 w-28 ${SK_PILL}`} />
          </div>

          <div className="mt-3 rounded-2xl border border-slate-100 bg-surface-subtle p-3 dark:border-slate-800">
            <div className="mb-3 flex items-center gap-2">
              <div className={`h-6 w-20 ${SK_PILL}`} />
              <div className={`h-6 w-28 ${SK_PILL}`} />
            </div>
            <div className="flex h-36 flex-col justify-between py-2">
              <div className="h-px w-full bg-slate-200/60 dark:bg-slate-700/50" />
              <div className="h-px w-full bg-slate-200/60 dark:bg-slate-700/50" />
              <div className="h-16 w-full rounded-xl bg-slate-200/60 dark:bg-slate-700/50" />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 pt-1">
            {Array.from({ length: 2 }, (_, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className={`h-2.5 w-24 ${SK}`} />
                <div className="flex items-center gap-2">
                  <div className={`h-6 w-10 ${SK}`} />
                  <div className={`h-4 w-12 ${SK_PILL}`} />
                </div>
              </div>
            ))}
          </div>
        </>
      ) : null}
    </article>
  );
}

const CHART_VARIANTS: readonly ChartSkeletonVariant[] = ['bar', 'donut', 'donut', 'trend'];

export function DashboardChartsSkeleton() {
  return (
    <section
      className="grid grid-cols-1 gap-5 md:grid-cols-2"
      aria-busy="true"
      aria-label="Loading analytics charts"
    >
      {CHART_VARIANTS.map((variant, idx) => (
        <ChartSkeletonCard key={idx} variant={variant} />
      ))}
    </section>
  );
}

export function DeadlineAlertsSkeleton() {
  return (
    <section
      className={`${SURFACE_TOKENS.card} animate-pulse p-5`}
      aria-busy="true"
      aria-label="Loading deadline alerts"
    >
      <div className="flex items-center justify-between gap-2 pb-4">
        <div className="flex items-center gap-2">
          <div className={`h-5 w-5 ${SK_PILL}`} />
          <div className={`h-5 w-36 ${SK}`} />
        </div>
        <div className={`h-4 w-32 ${SK}`} />
      </div>

      <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, idx) => (
          <div
            key={idx}
            className="rounded-2xl border border-slate-100 bg-surface-subtle p-4 dark:border-slate-800"
          >
            <div className="flex items-center justify-between gap-2">
              <div className={`h-4 w-20 ${SK_PILL}`} />
              <div className={`h-4 w-16 ${SK_PILL}`} />
            </div>
            <div className={`mt-2.5 h-4 w-3/4 ${SK}`} />
            <div className={`mt-3 h-1.5 w-full ${SK_PILL}`} />
            <div className={`mt-2.5 h-3 w-2/3 ${SK}`} />
          </div>
        ))}
      </div>
    </section>
  );
}
