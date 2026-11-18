import { memo } from 'react';
import { Building2 } from 'lucide-react';
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
import { useTheme } from '../../../theme/themeContext';
import { getChartPalette, SURFACE_TOKENS } from '../../../theme/tokens';
import type { DepartmentProgressItem } from '../../../types/auth';

interface AccessCoverageChartCardProps {
  averageProgress: number;
  totalProjects: number;
  departmentProgress: readonly DepartmentProgressItem[];
}

interface BarDatum {
  key: string;
  label: string;
  code: string;
  score: number;
  projectCount: number;
  patternId: string;
  stroke: string;
  pillClass: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value?: number; payload?: BarDatum }>;
}

function CoverageTooltip({ active, payload }: CustomTooltipProps) {
  const item = payload?.[0];
  if (!active || !item?.payload) return null;

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-xs shadow-lg dark:border-slate-700 dark:bg-slate-950">
      <p className="font-semibold text-slate-800 dark:text-slate-100">
        {item.payload.label} ({item.payload.code})
      </p>
      <p className="mt-0.5 text-slate-500 dark:text-slate-400">
        Avg Progress: {item.value}% ({item.payload.projectCount} projects)
      </p>
    </div>
  );
}

export const AccessCoverageChartCard = memo(function AccessCoverageChartCard({
  averageProgress,
  totalProjects,
  departmentProgress,
}: AccessCoverageChartCardProps) {
  const { isDark } = useTheme();
  const chart = getChartPalette(isDark);

  const data: BarDatum[] = departmentProgress.map((item, idx) => {
    const tone = chart.departmentTones[idx % chart.departmentTones.length]!;
    return {
      key: item.id,
      label: item.label,
      code: item.code,
      score: item.avgProgress,
      projectCount: item.projectCount,
      patternId: `deptHatch-${idx % chart.departmentTones.length}`,
      stroke: tone.border,
      pillClass: tone.pillClass,
    };
  });

  const topSummary = [...data]
    .sort((a, b) => b.projectCount - a.projectCount || b.score - a.score)
    .slice(0, 3);

  return (
    <article className={`${SURFACE_TOKENS.card} flex flex-col justify-between p-5`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Department Progress
          </h2>
          <p className="tabular-nums mt-2 text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {averageProgress}%
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Across {data.length} departments &middot; {totalProjects} projects
          </p>
        </div>

        <ul className="min-h-[108px] space-y-2" aria-label="Top department progress summary">
          {topSummary.map((item) => (
            <li key={item.key} className="flex items-center gap-2.5">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold ${item.pillClass}`}
              >
                <Building2 className="h-3.5 w-3.5" />
              </span>
              <div className="leading-tight">
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  {item.label}
                </p>
                <p className="tabular-nums text-xs font-bold text-slate-800 dark:text-slate-100">
                  {item.score}%
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4 h-48 w-full min-w-0">
        {data.length === 0 ? (
          <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-slate-200 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
            No active departments yet.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 20, right: 4, left: 4, bottom: 0 }}
              barCategoryGap={10}
            >
              <defs>
                {chart.departmentTones.map((tone, idx) => (
                  <pattern
                    key={idx}
                    id={`deptHatch-${idx}`}
                    width="8"
                    height="8"
                    patternUnits="userSpaceOnUse"
                    patternTransform="rotate(45)"
                  >
                    <rect width="8" height="8" fill={tone.hatchBase} />
                    <line
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="8"
                      stroke={tone.hatchLine}
                      strokeOpacity="0.22"
                      strokeWidth="2.2"
                    />
                  </pattern>
                ))}
              </defs>

              <XAxis
                dataKey="label"
                interval={0}
                axisLine={false}
                tickLine={false}
                tick={{ ...chart.axisTick, fontSize: 10 }}
              />
              <YAxis hide domain={[0, 118]} />
              <Tooltip
                wrapperStyle={{ zIndex: 40, pointerEvents: 'none' }}
                cursor={{ fill: chart.tooltipCursor, radius: 12 }}
                content={<CoverageTooltip />}
              />
              <Bar
                dataKey="score"
                radius={[12, 12, 12, 12]}
                minPointSize={6}
                isAnimationActive={false}
              >
                <LabelList
                  dataKey="score"
                  position="top"
                  formatter={(val: unknown) => `${String(val ?? 0)}%`}
                  style={{ fill: chart.labelFill, fontSize: 10, fontWeight: 600 }}
                />
                {data.map((entry) => (
                  <Cell
                    key={entry.key}
                    fill={`url(#${entry.patternId})`}
                    stroke={entry.stroke}
                    strokeWidth={1.25}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </article>
  );
});
