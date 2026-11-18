import { memo, useState, type ReactNode } from 'react';
import { Hash, Percent } from 'lucide-react';
import { useTheme } from '../../../theme/themeContext';
import { getChartPalette, SURFACE_TOKENS } from '../../../theme/tokens';

export interface DonutSliceInput {
  key: string;
  label: string;
  count: number;
  fill: string;
  barClass: string;
}

interface ComputedDonutSlice extends DonutSliceInput {
  percent: number;
}

interface StatusDonutCardProps {
  title: string;
  totalCount: number;
  itemNoun: string;
  emptyLabel: string;
  slices: readonly DonutSliceInput[];
  footer?: ReactNode;
}

const DONUT_SIZE = 180;
const CENTER = DONUT_SIZE / 2;
const RING_RADIUS = 64;
const RING_STROKE = 20;
const CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const SLICE_GAP_ARC = 26;

export const StatusDonutCard = memo(function StatusDonutCard({
  title,
  totalCount,
  itemNoun,
  emptyLabel,
  slices,
  footer,
}: StatusDonutCardProps) {
  const { isDark } = useTheme();
  const chart = getChartPalette(isDark);
  const [unit, setUnit] = useState<'count' | 'percent'>('count');
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);

  const safeTotal =
    totalCount > 0 ? totalCount : slices.reduce((sum, item) => sum + item.count, 0);

  const computedSlices: ComputedDonutSlice[] = slices.map((item) => ({
    ...item,
    percent: safeTotal > 0 ? Math.round((item.count / safeTotal) * 100) : 0,
  }));

  const nonZeroSlices = computedSlices.filter((slice) => slice.count > 0);
  const hoveredSlice = hoveredKey
    ? nonZeroSlices.find((slice) => slice.key === hoveredKey) ?? null
    : null;

  const segments = (() => {
    if (nonZeroSlices.length === 0) return [];
    if (nonZeroSlices.length === 1) {
      return [{ slice: nonZeroSlices[0]!, dashArray: `${CIRCUMFERENCE} 0`, rotateDeg: -90 }];
    }

    const totalGap = nonZeroSlices.length * SLICE_GAP_ARC;
    const availableArc = Math.max(40, CIRCUMFERENCE - totalGap);
    let offsetArc = SLICE_GAP_ARC / 2;

    return nonZeroSlices.map((slice) => {
      const arcLen = Math.max(4, (slice.count / safeTotal) * availableArc);
      const rotateDeg = -90 + (offsetArc / CIRCUMFERENCE) * 360;
      offsetArc += arcLen + SLICE_GAP_ARC;
      return {
        slice,
        dashArray: `${arcLen} ${CIRCUMFERENCE}`,
        rotateDeg,
      };
    });
  })();

  return (
    <article className={`${SURFACE_TOKENS.card} flex flex-col justify-between p-5`}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h2>

        <div
          className="inline-flex items-center rounded-full border border-slate-200/80 bg-surface-subtle p-0.5 dark:border-slate-700"
          role="group"
          aria-label={`Toggle ${title} metric unit`}
        >
          <button
            type="button"
            onClick={() => setUnit('count')}
            aria-label="Show counts"
            className={`flex h-7 w-7 cursor-pointer items-center justify-center rounded-full transition ${
              unit === 'count'
                ? 'bg-surface text-slate-900 shadow-2xs dark:text-slate-100'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Hash className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setUnit('percent')}
            aria-label="Show percentages"
            className={`flex h-7 w-7 cursor-pointer items-center justify-center rounded-full transition ${
              unit === 'percent'
                ? 'bg-surface text-slate-900 shadow-2xs dark:text-slate-100'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Percent className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="relative mx-auto my-2 h-44 w-44">
        <div className="pointer-events-none absolute inset-0 z-0 flex flex-col items-center justify-center">
          <span className="tabular-nums text-2xl font-bold text-slate-900 dark:text-slate-100">
            {safeTotal}
          </span>
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            {itemNoun}
          </span>
        </div>

        {hoveredSlice ? (
          <div
            role="status"
            className="pointer-events-none absolute -top-2 left-1/2 z-30 -translate-x-1/2 rounded-xl border border-slate-200/80 bg-white px-3 py-1.5 text-xs whitespace-nowrap shadow-lg dark:border-slate-700 dark:bg-slate-950"
          >
            <p className="font-semibold text-slate-800 dark:text-slate-100">{hoveredSlice.label}</p>
            <p className="text-slate-500 dark:text-slate-400">
              {hoveredSlice.count} {itemNoun} ({hoveredSlice.percent}%)
            </p>
          </div>
        ) : null}

        <svg
          viewBox={`0 0 ${DONUT_SIZE} ${DONUT_SIZE}`}
          className="relative z-10 h-full w-full select-none"
          role="img"
          aria-label={
            nonZeroSlices.length > 0
              ? `${title}: ${nonZeroSlices.map((s) => `${s.label} ${s.count}`).join(', ')}`
              : `${title}: ${emptyLabel}`
          }
        >
          {segments.length === 0 ? (
            <circle
              cx={CENTER}
              cy={CENTER}
              r={RING_RADIUS}
              fill="none"
              stroke={chart.emptySlice}
              strokeWidth={RING_STROKE}
            />
          ) : (
            segments.map(({ slice, dashArray, rotateDeg }) => (
              <circle
                key={slice.key}
                cx={CENTER}
                cy={CENTER}
                r={RING_RADIUS}
                fill="none"
                stroke={slice.fill}
                strokeWidth={hoveredKey === slice.key ? RING_STROKE + 2 : RING_STROKE}
                strokeDasharray={dashArray}
                strokeLinecap="round"
                transform={`rotate(${rotateDeg} ${CENTER} ${CENTER})`}
                className="cursor-pointer transition-[stroke-width] duration-150"
                onMouseEnter={() => setHoveredKey(slice.key)}
                onMouseLeave={() => setHoveredKey(null)}
              />
            ))
          )}
        </svg>
      </div>

      <div className="space-y-3 pt-1">
        <ul className="space-y-3">
          {computedSlices.map((slice) => (
            <li key={slice.key}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="font-medium text-slate-600 dark:text-slate-300">
                  {slice.label}
                </span>
                <span className="tabular-nums font-semibold text-slate-800 dark:text-slate-100">
                  {unit === 'count' ? `${slice.count}/${safeTotal}` : `${slice.percent}%`}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${slice.barClass}`}
                  style={{ width: `${Math.max(slice.percent, slice.count > 0 ? 12 : 0)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
        {footer}
      </div>
    </article>
  );
});
