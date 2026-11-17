import { memo } from 'react';
import { Calendar, TrendingUp } from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useTheme } from '../../../theme/themeContext';
import { CHART_SERIES_TOKENS, getChartPalette, SURFACE_TOKENS } from '../../../theme/tokens';
import type { ActivityTrendPoint } from '../../../types/auth';

interface AuthActivityTrendCardProps {
  activityTrend: readonly ActivityTrendPoint[];
}

interface TrendTooltipProps {
  active?: boolean;
  label?: string;
  payload?: Array<{ name?: string; value?: number; color?: string }>;
}

function TrendTooltip({ active, label, payload }: TrendTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-xs shadow-lg dark:border-slate-700 dark:bg-slate-950">
      <p className="mb-1 font-semibold text-slate-800 dark:text-slate-100">{label}</p>
      {payload.map((entry) => (
        <div
          key={entry.name}
          className="flex items-center gap-2 text-slate-600 dark:text-slate-300"
        >
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: entry.color ?? CHART_SERIES_TOKENS.sky.fillStop }}
          />
          <span>{entry.name}:</span>
          <span className="tabular-nums font-semibold text-slate-900 dark:text-slate-100">
            {entry.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export const AuthActivityTrendCard = memo(function AuthActivityTrendCard({
  activityTrend,
}: AuthActivityTrendCardProps) {
  const { isDark } = useTheme();
  const chart = getChartPalette(isDark);

  const series = [...activityTrend];
  const totalSignIns = series.reduce((sum, point) => sum + point.signIns, 0);
  const totalMutations = series.reduce((sum, point) => sum + point.mutations, 0);

  return (
    <article className={`${SURFACE_TOKENS.card} flex flex-col justify-between p-5`}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          Activity Trend
        </h2>

        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-surface-subtle px-3 py-1.5 text-xs font-medium text-slate-700 dark:border-slate-700 dark:text-slate-300">
          <Calendar className="h-3.5 w-3.5 text-slate-400" />
          <span>Last 5 Days</span>
        </span>
      </div>

      <div className="mt-3 rounded-2xl border border-slate-100 bg-surface-subtle p-3 dark:border-slate-800">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-surface px-2.5 py-1 text-[11px] font-semibold text-slate-700 ring-1 ring-slate-200/70 dark:text-slate-200 dark:ring-slate-700">
            <span className="h-2 w-2 rounded-full bg-sky-400" />
            Sign-ins
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-surface px-2.5 py-1 text-[11px] font-semibold text-slate-700 ring-1 ring-slate-200/70 dark:text-slate-200 dark:ring-slate-700">
            <span className="h-2 w-2 rounded-full bg-rose-400" />
            Workspace changes
          </span>
        </div>

        <div className="h-36 w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series} margin={{ top: 8, right: 6, left: -24, bottom: 0 }}>
              <defs>
                <linearGradient id="skyPastelFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chart.series.sky.fillStop} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={chart.series.sky.fillStop} stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="rosePastelFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chart.series.rose.fillStop} stopOpacity={0.32} />
                  <stop offset="95%" stopColor={chart.series.rose.fillStop} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke={chart.gridStroke}
              />
              <XAxis
                dataKey="period"
                axisLine={false}
                tickLine={false}
                tick={chart.axisTick}
              />
              <YAxis hide allowDecimals={false} />
              <Tooltip
                wrapperStyle={{ zIndex: 40, pointerEvents: 'none' }}
                content={<TrendTooltip />}
              />
              <Area
                type="monotone"
                dataKey="signIns"
                name="Sign-ins"
                stroke={chart.series.sky.stroke}
                strokeWidth={2.2}
                fill="url(#skyPastelFill)"
                activeDot={{
                  r: 4,
                  fill: chart.series.sky.dot,
                  stroke: chart.dotBorder,
                  strokeWidth: 2,
                }}
              />
              <Area
                type="monotone"
                dataKey="mutations"
                name="Workspace changes"
                stroke={chart.series.rose.stroke}
                strokeWidth={2}
                fill="url(#rosePastelFill)"
                activeDot={{
                  r: 4,
                  fill: chart.series.rose.dot,
                  stroke: chart.dotBorder,
                  strokeWidth: 2,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 pt-1">
        <div>
          <p className="text-[11px] font-medium text-slate-400">Logged sign-ins</p>
          <div className="mt-1 flex items-center gap-1.5">
            <span className="tabular-nums text-xl font-bold text-slate-900 dark:text-slate-100">
              {totalSignIns}
            </span>
            <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
              <TrendingUp className="h-3 w-3" />
              Live
            </span>
          </div>
        </div>

        <div>
          <p className="text-[11px] font-medium text-slate-400">Audit updates</p>
          <div className="mt-1 flex items-center gap-1.5">
            <span className="tabular-nums text-xl font-bold text-slate-900 dark:text-slate-100">
              {totalMutations}
            </span>
            <span className="rounded-full bg-sky-50 px-1.5 py-0.5 text-[10px] font-semibold text-sky-700 dark:bg-sky-500/15 dark:text-sky-300">
              Synced
            </span>
          </div>
        </div>
      </div>
    </article>
  );
});
