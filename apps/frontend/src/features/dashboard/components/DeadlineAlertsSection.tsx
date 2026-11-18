import { AlertTriangle, ArrowRight, CalendarClock, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDeadlineCountdown } from '../../../lib/formatters';
import { BADGE_TOKENS, SURFACE_TOKENS } from '../../../theme/tokens';
import type { DeadlineAlertItem } from '../../../types/auth';

interface DeadlineAlertsSectionProps {
  alerts: readonly DeadlineAlertItem[];
}

export function DeadlineAlertsSection({ alerts }: DeadlineAlertsSectionProps) {
  const hasCritical = alerts.some((alert) => alert.urgency === 'critical');

  return (
    <section className={`${SURFACE_TOKENS.card} p-5`} aria-label="Deadline alerts">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-4">
        <div className="flex items-center gap-2">
          {hasCritical ? (
            <AlertTriangle className="h-4 w-4 text-rose-500" aria-hidden="true" />
          ) : (
            <CalendarClock className="h-4 w-4 text-amber-500" aria-hidden="true" />
          )}
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Deadline Alerts
          </h2>
          <span
            className={`tabular-nums rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
              alerts.length === 0
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300'
                : hasCritical
                  ? BADGE_TOKENS.deadlineUrgency.critical.badge
                  : BADGE_TOKENS.deadlineUrgency.warning.badge
            }`}
          >
            {alerts.length === 0 ? 'On track' : `${alerts.length} due within 14d`}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <Link
            to="/projects"
            className="text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
          >
            Recent Projects
          </Link>
          <Link
            to="/projects?sort=deadline"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-700 hover:text-sky-900 dark:text-sky-300 dark:hover:text-sky-200"
          >
            View Deadlines
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {alerts.length === 0 ? (
        <div
          role="status"
          className="flex items-center gap-3 rounded-2xl border border-emerald-200/80 bg-emerald-50/60 px-4 py-3.5 text-xs text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-950/20 dark:text-emerald-200"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>
            All active projects are on schedule — no upcoming deadlines in the next 14 days.
          </span>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 lg:grid-cols-3">
          {alerts.map((alert) => {
            const urgencyStyle = BADGE_TOKENS.deadlineUrgency[alert.urgency];
            return (
              <Link
                key={alert.id}
                to={`/projects?q=${encodeURIComponent(alert.name)}`}
                className={`rounded-2xl border p-4 transition ${urgencyStyle.card}`}
              >
                <div className="flex items-center justify-between gap-2 text-[11px]">
                  <span className="font-semibold text-slate-700 dark:text-slate-200">
                    {alert.departmentName}
                  </span>
                  <span
                    className={`tabular-nums rounded-full px-2 py-0.5 font-semibold ${urgencyStyle.badge}`}
                  >
                    {formatDeadlineCountdown(alert.daysRemaining)}
                  </span>
                </div>

                <div className="mt-2 flex items-center gap-1.5">
                  {alert.urgency === 'critical' ? (
                    <AlertTriangle
                      className={`h-3.5 w-3.5 shrink-0 ${urgencyStyle.icon}`}
                      aria-hidden="true"
                    />
                  ) : (
                    <CalendarClock
                      className={`h-3.5 w-3.5 shrink-0 ${urgencyStyle.icon}`}
                      aria-hidden="true"
                    />
                  )}
                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {alert.name}
                  </p>
                </div>

                <div className="mt-2.5 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/80 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full bg-sky-400 dark:bg-sky-400"
                      style={{ width: `${alert.progress}%` }}
                    />
                  </div>
                  <span className="tabular-nums text-[11px] font-bold text-slate-700 dark:text-slate-200">
                    {alert.progress}%
                  </span>
                </div>

                <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                  Due {new Date(alert.dueDate).toLocaleDateString()} &middot; {alert.ownerName}
                  {(alert.teamCount ?? 1) > 1 ? ` +${(alert.teamCount ?? 1) - 1}` : ''}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}

