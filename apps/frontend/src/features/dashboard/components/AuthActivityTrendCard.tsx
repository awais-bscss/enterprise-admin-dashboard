import { memo, useState } from 'react';
import { Calendar, TrendingUp } from 'lucide-react';
import { useTheme } from '../../../theme/themeContext';
import { CHART_SERIES_TOKENS, getChartPalette, SURFACE_TOKENS } from '../../../theme/tokens';
import type { ActivityTrendPoint } from '../../../types/auth';

interface AuthActivityTrendCardProps {
  activityTrend: readonly ActivityTrendPoint[];
}

interface SvgPoint {
  x: number;
  y: number;
}

const CHART_W = 520;
const CHART_H = 148;
const PAD_X = 22;
const PAD_TOP = 14;
const PAD_BOTTOM = 24;
const PLOT_W = CHART_W - PAD_X * 2;
const PLOT_H = CHART_H - PAD_TOP - PAD_BOTTOM;
const BASELINE_Y = PAD_TOP + PLOT_H;

function buildSmoothPath(points: readonly SvgPoint[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0]!.x} ${points[0]!.y}`;

  const segments: string[] = [`M ${points[0]!.x.toFixed(1)} ${points[0]!.y.toFixed(1)}`];

  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[Math.max(0, i - 1)]!;
    const p1 = points[i]!;
    const p2 = points[i + 1]!;
    const p3 = points[Math.min(points.length - 1, i + 2)]!;

    const cx1 = p1.x + (p2.x - p0.x) / 6;
    const cy1 = Math.max(PAD_TOP, Math.min(BASELINE_Y, p1.y + (p2.y - p0.y) / 6));
    const cx2 = p2.x - (p3.x - p1.x) / 6;
    const cy2 = Math.max(PAD_TOP, Math.min(BASELINE_Y, p2.y - (p3.y - p1.y) / 6));

    segments.push(
      `C ${cx1.toFixed(1)} ${cy1.toFixed(1)}, ${cx2.toFixed(1)} ${cy2.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`,
    );
  }

  return segments.join(' ');
}

function buildAreaPath(points: readonly SvgPoint[], linePath: string): string {
  if (points.length === 0 || !linePath) return '';
  const first = points[0]!;
  const last = points[points.length - 1]!;
  return `${linePath} L ${last.x.toFixed(1)} ${BASELINE_Y} L ${first.x.toFixed(1)} ${BASELINE_Y} Z`;
}

export const AuthActivityTrendCard = memo(function AuthActivityTrendCard({
  activityTrend,
}: AuthActivityTrendCardProps) {
  const { isDark } = useTheme();
  const chart = getChartPalette(isDark);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const series = [...activityTrend];
  const totalSignIns = series.reduce((sum, point) => sum + point.signIns, 0);
  const totalMutations = series.reduce((sum, point) => sum + point.mutations, 0);

  const maxVal = Math.max(1, ...series.flatMap((point) => [point.signIns, point.mutations]));
  const mapPoint = (idx: number, val: number): SvgPoint => {
    const x =
      series.length <= 1 ? PAD_X + PLOT_W / 2 : PAD_X + (idx / (series.length - 1)) * PLOT_W;
    const y = BASELINE_Y - (val / maxVal) * PLOT_H;
    return { x, y };
  };

  const signInPoints = series.map((point, idx) => mapPoint(idx, point.signIns));
  const mutationPoints = series.map((point, idx) => mapPoint(idx, point.mutations));

  const signInLine = buildSmoothPath(signInPoints);
  const mutationLine = buildSmoothPath(mutationPoints);
  const signInArea = buildAreaPath(signInPoints, signInLine);
  const mutationArea = buildAreaPath(mutationPoints, mutationLine);

  const hoveredPoint = hoveredIdx !== null ? series[hoveredIdx] ?? null : null;
  const hitWidth = series.length > 0 ? PLOT_W / series.length : PLOT_W;

  return (
    <article className={`${SURFACE_TOKENS.card} flex flex-col justify-between p-5`}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          Activity Trend
        </h2>

        <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-surface-subtle px-3 py-1.5 text-xs font-medium text-slate-700 dark:border-slate-700 dark:text-slate-300">
          <Calendar className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
          <span>Last 5 Days</span>
        </span>
      </div>

      <div className="mt-3 rounded-2xl border border-slate-100 bg-surface-subtle p-3 dark:border-slate-800">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-surface px-2.5 py-1 text-[11px] font-semibold text-slate-700 ring-1 ring-slate-200/70 dark:text-slate-200 dark:ring-slate-700">
            <span className="h-2 w-2 rounded-full bg-sky-300" />
            Sign-ins
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-surface px-2.5 py-1 text-[11px] font-semibold text-slate-700 ring-1 ring-slate-200/70 dark:text-slate-200 dark:ring-slate-700">
            <span className="h-2 w-2 rounded-full bg-rose-300" />
            Workspace changes
          </span>
        </div>

        <div className="relative h-36 w-full min-w-0">
          {hoveredPoint && hoveredIdx !== null ? (
            <div
              role="status"
              style={{
                left: `${
                  series.length <= 1
                    ? 50
                    : Math.min(82, Math.max(18, (hoveredIdx / (series.length - 1)) * 100))
                }%`,
              }}
              className="pointer-events-none absolute -top-2 z-30 -translate-x-1/2 rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-xs whitespace-nowrap shadow-lg dark:border-slate-700 dark:bg-slate-950"
            >
              <p className="mb-1 font-semibold text-slate-800 dark:text-slate-100">
                {hoveredPoint.period}
              </p>
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: chart.series.sky.fillStop }}
                />
                <span>Sign-ins:</span>
                <span className="tabular-nums font-semibold text-slate-900 dark:text-slate-100">
                  {hoveredPoint.signIns}
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: chart.series.rose.fillStop }}
                />
                <span>Workspace changes:</span>
                <span className="tabular-nums font-semibold text-slate-900 dark:text-slate-100">
                  {hoveredPoint.mutations}
                </span>
              </div>
            </div>
          ) : null}

          <svg
            viewBox={`0 0 ${CHART_W} ${CHART_H}`}
            className="h-full w-full overflow-visible select-none"
            role="img"
            aria-label={
              series.length > 0
                ? `5-day trend: ${series.map((p) => `${p.period} ${p.signIns} sign-ins, ${p.mutations} updates`).join('; ')}`
                : 'Last 5 days activity trend'
            }
          >
            <defs>
              <linearGradient id="skyPastelFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={chart.series.sky.fillStop} stopOpacity="0.25" />
                <stop offset="95%" stopColor={chart.series.sky.fillStop} stopOpacity="0.02" />
              </linearGradient>
              <linearGradient id="rosePastelFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={chart.series.rose.fillStop} stopOpacity="0.22" />
                <stop offset="95%" stopColor={chart.series.rose.fillStop} stopOpacity="0.02" />
              </linearGradient>
            </defs>

            {[PAD_TOP, PAD_TOP + PLOT_H / 2, BASELINE_Y].map((yPos, idx) => (
              <line
                key={idx}
                x1={PAD_X}
                y1={yPos}
                x2={CHART_W - PAD_X}
                y2={yPos}
                stroke={chart.gridStroke}
                strokeDasharray="3 3"
                strokeWidth="1"
              />
            ))}

            {signInArea ? <path d={signInArea} fill="url(#skyPastelFill)" /> : null}
            {mutationArea ? <path d={mutationArea} fill="url(#rosePastelFill)" /> : null}
            {signInLine ? (
              <path
                d={signInLine}
                fill="none"
                stroke={chart.series.sky.stroke}
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            ) : null}
            {mutationLine ? (
              <path
                d={mutationLine}
                fill="none"
                stroke={chart.series.rose.stroke}
                strokeWidth="2"
                strokeLinecap="round"
              />
            ) : null}

            {series.map((point, idx) => {
              const sPt = signInPoints[idx]!;
              const mPt = mutationPoints[idx]!;
              const isHovered = hoveredIdx === idx;
              const hitX = sPt.x - hitWidth / 2;

              return (
                <g
                  key={point.period}
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                >
                  {isHovered ? (
                    <>
                      <line
                        x1={sPt.x}
                        y1={PAD_TOP}
                        x2={sPt.x}
                        y2={BASELINE_Y}
                        stroke={CHART_SERIES_TOKENS.sky.stroke}
                        strokeOpacity="0.35"
                        strokeDasharray="3 3"
                      />
                      <circle
                        cx={sPt.x}
                        cy={sPt.y}
                        r="4"
                        fill={chart.series.sky.dot}
                        stroke={chart.dotBorder}
                        strokeWidth="2"
                      />
                      <circle
                        cx={mPt.x}
                        cy={mPt.y}
                        r="4"
                        fill={chart.series.rose.dot}
                        stroke={chart.dotBorder}
                        strokeWidth="2"
                      />
                    </>
                  ) : null}

                  <text
                    x={sPt.x}
                    y={BASELINE_Y + 16}
                    textAnchor="middle"
                    fill={chart.axisTick.fill}
                    fontSize="11"
                    fontWeight="500"
                  >
                    {point.period}
                  </text>

                  <rect
                    x={Math.max(0, hitX)}
                    y={PAD_TOP}
                    width={hitWidth}
                    height={PLOT_H + PAD_BOTTOM}
                    fill="transparent"
                  />
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 pt-1">
        <div>
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            Logged sign-ins
          </p>
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
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            Audit updates
          </p>
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
