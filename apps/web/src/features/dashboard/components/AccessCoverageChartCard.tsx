import { Code2, Palette, ShieldCheck, TestTube2 } from 'lucide-react';
import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { CategoryProgressItem, ProjectCategory } from '../../../types/auth';
import { CHART_TOKENS, SURFACE_TOKENS } from '../../../theme/tokens';

interface AccessCoverageChartCardProps {
  averageProgress: number;
  totalProjects: number;
  categoryProgress: readonly CategoryProgressItem[];
}

interface BarDatum {
  key: ProjectCategory;
  label: string;
  score: number;
  projectCount: number;
  patternId: string;
  stroke: string;
}

const CATEGORY_VISUALS: Record<
  ProjectCategory,
  {
    patternId: string;
    stroke: string;
    icon: typeof Code2;
    badgeClass: string;
  }
> = {
  development: {
    patternId: 'url(#pastelHatchRose)',
    stroke: CHART_TOKENS.series.rose.border,
    icon: Code2,
    badgeClass: 'bg-rose-50 text-rose-600 ring-1 ring-rose-100',
  },
  design: {
    patternId: 'url(#pastelHatchSky)',
    stroke: CHART_TOKENS.series.sky.border,
    icon: Palette,
    badgeClass: 'bg-sky-50 text-sky-600 ring-1 ring-sky-100',
  },
  testing: {
    patternId: 'url(#pastelHatchMint)',
    stroke: CHART_TOKENS.series.mint.border,
    icon: TestTube2,
    badgeClass: 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100',
  },
  security: {
    patternId: 'url(#pastelHatchViolet)',
    stroke: CHART_TOKENS.series.violet.border,
    icon: ShieldCheck,
    badgeClass: 'bg-violet-50 text-violet-600 ring-1 ring-violet-100',
  },
};

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value?: number; payload?: BarDatum }>;
}

function CoverageTooltip({ active, payload }: CustomTooltipProps) {
  const item = payload?.[0];
  if (!active || !item?.payload) return null;

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-xs shadow-sm">
      <p className="font-semibold text-slate-800">{item.payload.label}</p>
      <p className="mt-0.5 text-slate-500">
        Avg Progress: {item.value}% ({item.payload.projectCount} projects)
      </p>
    </div>
  );
}

export function AccessCoverageChartCard({
  averageProgress,
  totalProjects,
  categoryProgress,
}: AccessCoverageChartCardProps) {
  const data: BarDatum[] = categoryProgress.map((item) => {
    const visual = CATEGORY_VISUALS[item.category];
    return {
      key: item.category,
      label: item.label,
      score: item.avgProgress,
      projectCount: item.projectCount,
      patternId: visual.patternId,
      stroke: visual.stroke,
    };
  });

  return (
    <article className={`${SURFACE_TOKENS.card} flex flex-col justify-between p-5`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Track Progress</h2>
          <p className="tabular-nums mt-2 text-4xl font-bold tracking-tight text-slate-900">
            {averageProgress}%
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Average progress across {totalProjects} projects
          </p>
        </div>

        <ul className="space-y-2" aria-label="Track progress summary">
          {data.slice(0, 3).map((item) => {
            const visual = CATEGORY_VISUALS[item.key];
            const Icon = visual.icon;
            return (
              <li key={item.key} className="flex items-center gap-2.5">
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full ${visual.badgeClass}`}
                >
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <div className="leading-tight">
                  <p className="text-[11px] font-medium text-slate-400">{item.label}</p>
                  <p className="tabular-nums text-xs font-bold text-slate-800">{item.score}%</p>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="mt-4 h-44 w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 4, left: 4, bottom: 0 }} barCategoryGap={14}>
            <defs>
              <pattern
                id="pastelHatchRose"
                width="8"
                height="8"
                patternUnits="userSpaceOnUse"
                patternTransform="rotate(45)"
              >
                <rect width="8" height="8" fill={CHART_TOKENS.series.rose.hatchBase} />
                <line
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="8"
                  stroke={CHART_TOKENS.series.rose.hatchLine}
                  strokeOpacity="0.3"
                  strokeWidth="2.5"
                />
              </pattern>
              <pattern
                id="pastelHatchSky"
                width="8"
                height="8"
                patternUnits="userSpaceOnUse"
                patternTransform="rotate(45)"
              >
                <rect width="8" height="8" fill={CHART_TOKENS.series.sky.hatchBase} />
                <line
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="8"
                  stroke={CHART_TOKENS.series.sky.hatchLine}
                  strokeOpacity="0.3"
                  strokeWidth="2.5"
                />
              </pattern>
              <pattern
                id="pastelHatchMint"
                width="8"
                height="8"
                patternUnits="userSpaceOnUse"
                patternTransform="rotate(45)"
              >
                <rect width="8" height="8" fill={CHART_TOKENS.series.mint.hatchBase} />
                <line
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="8"
                  stroke={CHART_TOKENS.series.mint.hatchLine}
                  strokeOpacity="0.3"
                  strokeWidth="2.5"
                />
              </pattern>
              <pattern
                id="pastelHatchViolet"
                width="8"
                height="8"
                patternUnits="userSpaceOnUse"
                patternTransform="rotate(45)"
              >
                <rect width="8" height="8" fill={CHART_TOKENS.series.violet.hatchBase} />
                <line
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="8"
                  stroke={CHART_TOKENS.series.violet.hatchLine}
                  strokeOpacity="0.3"
                  strokeWidth="2.5"
                />
              </pattern>
            </defs>

            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={CHART_TOKENS.axisTick}
            />
            <YAxis hide domain={[0, 115]} />
            <Tooltip cursor={{ fill: CHART_TOKENS.tooltipCursor, radius: 14 }} content={<CoverageTooltip />} />
            <Bar dataKey="score" radius={[14, 14, 14, 14]}>
              <LabelList
                dataKey="score"
                position="top"
                formatter={(val: unknown) => `${String(val ?? 0)}%`}
                style={{ fill: CHART_TOKENS.labelFill, fontSize: 11, fontWeight: 600 }}
              />
              {data.map((entry) => (
                <Cell
                  key={entry.key}
                  fill={entry.patternId}
                  stroke={entry.stroke}
                  strokeWidth={1.5}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
}
