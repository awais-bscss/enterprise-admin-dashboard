import { memo, useState } from 'react';
import { Building2 } from 'lucide-react';
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

const CHART_W = 560;
const CHART_H = 196;
const PAD_X = 8;
const PAD_TOP = 24;
const PAD_BOTTOM = 26;
const PLOT_W = CHART_W - PAD_X * 2;
const PLOT_H = CHART_H - PAD_TOP - PAD_BOTTOM;

export const AccessCoverageChartCard = memo(function AccessCoverageChartCard({
  averageProgress,
  totalProjects,
  departmentProgress,
}: AccessCoverageChartCardProps) {
  const { isDark } = useTheme();
  const chart = getChartPalette(isDark);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

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

  const slotW = data.length > 0 ? PLOT_W / data.length : PLOT_W;
  const barW = Math.min(48, Math.max(18, slotW * 0.62));
  const hoveredItem = hoveredIdx !== null ? data[hoveredIdx] ?? null : null;

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

      <div className="relative mt-4 h-48 w-full min-w-0">
        {data.length === 0 ? (
          <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-slate-200 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
            No active departments yet.
          </div>
        ) : (
          <>
            {hoveredItem && hoveredIdx !== null ? (
              <div
                role="status"
                style={{
                  left: `${Math.min(82, Math.max(18, ((hoveredIdx + 0.5) / data.length) * 100))}%`,
                }}
                className="pointer-events-none absolute -top-2 z-30 -translate-x-1/2 rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-xs whitespace-nowrap shadow-lg dark:border-slate-700 dark:bg-slate-950"
              >
                <p className="font-semibold text-slate-800 dark:text-slate-100">
                  {hoveredItem.label} ({hoveredItem.code})
                </p>
                <p className="mt-0.5 text-slate-500 dark:text-slate-400">
                  Avg Progress: {hoveredItem.score}% ({hoveredItem.projectCount} projects)
                </p>
              </div>
            ) : null}

            <svg
              viewBox={`0 0 ${CHART_W} ${CHART_H}`}
              className="h-full w-full overflow-visible select-none"
              role="img"
              aria-label={`Average progress by department: ${data.map((d) => `${d.label} ${d.score}%`).join(', ')}`}
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

              {data.map((entry, idx) => {
                const slotX = PAD_X + idx * slotW;
                const centerX = slotX + slotW / 2;
                const barX = centerX - barW / 2;
                const clampedScore = Math.max(0, Math.min(100, entry.score));
                const barH = Math.max(6, (clampedScore / 100) * PLOT_H);
                const barY = PAD_TOP + PLOT_H - barH;
                const isHovered = hoveredIdx === idx;

                return (
                  <g
                    key={entry.key}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredIdx(idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                  >
                    {isHovered ? (
                      <rect
                        x={slotX + 2}
                        y={PAD_TOP - 4}
                        width={Math.max(8, slotW - 4)}
                        height={PLOT_H + 8}
                        rx="12"
                        fill={chart.tooltipCursor}
                      />
                    ) : null}

                    <rect
                      x={barX}
                      y={barY}
                      width={barW}
                      height={barH}
                      rx="10"
                      ry="10"
                      fill={`url(#${entry.patternId})`}
                      stroke={entry.stroke}
                      strokeWidth={isHovered ? 2 : 1.25}
                    />

                    <text
                      x={centerX}
                      y={barY - 6}
                      textAnchor="middle"
                      fill={chart.labelFill}
                      fontSize="10.5"
                      fontWeight="600"
                    >
                      {entry.score}%
                    </text>

                    <text
                      x={centerX}
                      y={PAD_TOP + PLOT_H + 17}
                      textAnchor="middle"
                      fill={chart.axisTick.fill}
                      fontSize="10.5"
                      fontWeight="500"
                    >
                      {entry.label.length > 9 ? entry.code : entry.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </>
        )}
      </div>
    </article>
  );
});
