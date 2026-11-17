import { memo, useState } from 'react';
import { Hash, Percent } from 'lucide-react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { useTheme } from '../../../theme/themeContext';
import { CHART_SERIES_TOKENS, getChartPalette, SURFACE_TOKENS } from '../../../theme/tokens';
import type { ProjectStatus, ProjectStatusBreakdownItem } from '../../../types/auth';

interface DirectoryStatusDonutCardProps {
  totalProjects: number;
  projectStatusBreakdown: readonly ProjectStatusBreakdownItem[];
}

interface StatusSlice {
  status: ProjectStatus;
  label: string;
  count: number;
  percent: number;
  fill: string;
  barClass: string;
}

const STATUS_META: Record<ProjectStatus, { label: string; barClass: string }> = {
  completed: {
    label: 'Completed',
    barClass: CHART_SERIES_TOKENS.mint.barClass,
  },
  in_progress: {
    label: 'In Progress',
    barClass: CHART_SERIES_TOKENS.rose.barClass,
  },
  upcoming: {
    label: 'Upcoming',
    barClass: CHART_SERIES_TOKENS.sky.barClass,
  },
};

interface DonutTooltipProps {
  active?: boolean;
  payload?: Array<{ payload?: StatusSlice }>;
}

function DonutTooltip({ active, payload }: DonutTooltipProps) {
  const slice = payload?.[0]?.payload;
  if (!active || !slice) return null;

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-xs shadow-lg dark:border-slate-700 dark:bg-slate-950">
      <p className="font-semibold text-slate-800 dark:text-slate-100">{slice.label}</p>
      <p className="mt-0.5 text-slate-500 dark:text-slate-400">
        {slice.count} projects ({slice.percent}%)
      </p>
    </div>
  );
}

export const DirectoryStatusDonutCard = memo(function DirectoryStatusDonutCard({
  totalProjects,
  projectStatusBreakdown,
}: DirectoryStatusDonutCardProps) {
  const { isDark } = useTheme();
  const chart = getChartPalette(isDark);
  const [unit, setUnit] = useState<'count' | 'percent'>('count');

  const fillMap: Record<ProjectStatus, string> = {
    completed: chart.series.mint.fill,
    in_progress: chart.series.rose.border,
    upcoming: chart.series.sky.fillStop,
  };

  const safeTotal =
    totalProjects > 0
      ? totalProjects
      : projectStatusBreakdown.reduce((sum, item) => sum + item.count, 0);

  const slices: StatusSlice[] = projectStatusBreakdown.map((item) => {
    const meta = STATUS_META[item.status];
    const percent = safeTotal > 0 ? Math.round((item.count / safeTotal) * 100) : 0;
    return {
      status: item.status,
      label: meta.label,
      count: item.count,
      percent,
      fill: fillMap[item.status],
      barClass: meta.barClass,
    };
  });

  const nonZeroSlices = slices.filter((slice) => slice.count > 0);
  const chartData =
    nonZeroSlices.length > 0
      ? nonZeroSlices
      : [
          {
            status: 'upcoming' as const,
            label: 'No projects yet',
            count: 1,
            percent: 0,
            fill: chart.emptySlice,
            barClass: 'bg-slate-200 dark:bg-slate-700',
          },
        ];

  return (
    <article className={`${SURFACE_TOKENS.card} flex flex-col justify-between p-5`}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          Project Status
        </h2>

        <div
          className="inline-flex items-center rounded-full border border-slate-200/80 bg-surface-subtle p-0.5 dark:border-slate-700"
          role="group"
          aria-label="Toggle metric display unit"
        >
          <button
            type="button"
            onClick={() => setUnit('count')}
            aria-label="Show counts"
            className={`flex h-7 w-7 cursor-pointer items-center justify-center rounded-full transition ${
              unit === 'count'
                ? 'bg-surface text-slate-900 shadow-2xs dark:text-slate-100'
                : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
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
                : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <Percent className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="relative mx-auto my-2 h-44 w-full min-w-0 max-w-[220px]">
        <div className="pointer-events-none absolute inset-0 z-0 flex flex-col items-center justify-center">
          <span className="tabular-nums text-2xl font-bold text-slate-900 dark:text-slate-100">
            {safeTotal}
          </span>
          <span className="text-[11px] font-medium text-slate-400">projects</span>
        </div>

        <div className="relative z-10 h-full w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              {nonZeroSlices.length > 0 ? (
                <Tooltip
                  wrapperStyle={{ zIndex: 40, pointerEvents: 'none' }}
                  content={<DonutTooltip />}
                />
              ) : null}
              <Pie
                data={chartData}
                dataKey="count"
                nameKey="label"
                innerRadius={54}
                outerRadius={74}
                paddingAngle={nonZeroSlices.length > 1 ? 6 : 0}
                cornerRadius={8}
                stroke="none"
              >
                {chartData.map((slice) => (
                  <Cell key={slice.status} fill={slice.fill} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <ul className="min-h-[124px] space-y-3 pt-1">
        {slices.map((slice) => (
          <li key={slice.status}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="font-medium text-slate-600 dark:text-slate-300">{slice.label}</span>
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
    </article>
  );
});
