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
import type { ActivityTrendPoint } from '../../../types/auth';
import { CHART_TOKENS, SURFACE_TOKENS } from '../../../theme/tokens';

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
    <div className="rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-xs shadow-sm">
      <p className="mb-1 font-semibold text-slate-800">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 text-slate-600">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: entry.color ?? CHART_TOKENS.series.sky.fillStop }}
          />
          <span>{entry.name}:</span>
          <span className="tabular-nums font-semibold text-slate-900">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

export function AuthActivityTrendCard({ activityTrend }: AuthActivityTrendCardProps) {
  const series = [...activityTrend];
  const totalSignIns = series.reduce((sum, point) => sum + point.signIns, 0);
  const totalMutations = series.reduce((sum, point) => sum + point.mutations, 0);

  return (
    <article className={`${SURFACE_TOKENS.card} flex flex-col justify-between p-5`}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-slate-900">Activity Trend</h2>

        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700">
          <Calendar className="h-3.5 w-3.5 text-slate-400" />
          <span>Last 5 Days</span>
        </span>
      </div>

      <div className="mt-3 rounded-2xl border border-slate-100 bg-slate-50/75 p-3">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 ring-1 ring-slate-200/70">
            <span className="h-2 w-2 rounded-full bg-sky-400" />
            Sign-ins
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 ring-1 ring-slate-200/70">
            <span className="h-2 w-2 rounded-full bg-rose-400" />
            Workspace changes
          </span>
        </div>

        <div className="h-36 w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series} margin={{ top: 8, right: 6, left: -24, bottom: 0 }}>
              <defs>
                <linearGradient id="skyPastelFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_TOKENS.series.sky.fillStop} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={CHART_TOKENS.series.sky.fillStop} stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="rosePastelFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_TOKENS.series.rose.fillStop} stopOpacity={0.32} />
                  <stop offset="95%" stopColor={CHART_TOKENS.series.rose.fillStop} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={CHART_TOKENS.gridStroke} />
              <XAxis
                dataKey="period"
                axisLine={false}
                tickLine={false}
                tick={CHART_TOKENS.axisTick}
              />
              <YAxis hide allowDecimals={false} />
              <Tooltip content={<TrendTooltip />} />
              <Area
                type="monotone"
                dataKey="signIns"
                name="Sign-ins"
                stroke={CHART_TOKENS.series.sky.stroke}
                strokeWidth={2.2}
                fill="url(#skyPastelFill)"
                activeDot={{
                  r: 4,
                  fill: CHART_TOKENS.series.sky.dot,
                  stroke: CHART_TOKENS.white,
                  strokeWidth: 2,
                }}
              />
              <Area
                type="monotone"
                dataKey="mutations"
                name="Workspace changes"
                stroke={CHART_TOKENS.series.rose.stroke}
                strokeWidth={2}
                fill="url(#rosePastelFill)"
                activeDot={{
                  r: 4,
                  fill: CHART_TOKENS.series.rose.dot,
                  stroke: CHART_TOKENS.white,
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
            <span className="tabular-nums text-xl font-bold text-slate-900">{totalSignIns}</span>
            <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
              <TrendingUp className="h-3 w-3" />
              Live
            </span>
          </div>
        </div>

        <div>
          <p className="text-[11px] font-medium text-slate-400">Audit updates</p>
          <div className="mt-1 flex items-center gap-1.5">
            <span className="tabular-nums text-xl font-bold text-slate-900">{totalMutations}</span>
            <span className="rounded-full bg-sky-50 px-1.5 py-0.5 text-[10px] font-semibold text-sky-700">
              Synced
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
