import type { LucideIcon } from 'lucide-react';
import { CheckCircle2, PauseCircle } from 'lucide-react';
import { SURFACE_TOKENS } from '../theme/tokens';
import type { EntityStatusStats } from '../types/auth';

interface StatusSummaryCardsProps {
  totalLabel: string;
  stats: EntityStatusStats;
  icon: LucideIcon;
  ariaLabel: string;
  loading?: boolean;
}

export function StatusSummaryCards({
  totalLabel,
  stats,
  icon: TotalIcon,
  ariaLabel,
  loading = false,
}: StatusSummaryCardsProps) {
  const cards = [
    {
      label: totalLabel,
      value: stats.total,
      icon: TotalIcon,
      iconWrapClass: 'bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
      valueClass: 'text-slate-900 dark:text-slate-100',
    },
    {
      label: 'Active',
      value: stats.active,
      icon: CheckCircle2,
      iconWrapClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
      valueClass: 'text-emerald-700 dark:text-emerald-300',
    },
    {
      label: 'Inactive',
      value: stats.inactive,
      icon: PauseCircle,
      iconWrapClass: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
      valueClass: 'text-slate-700 dark:text-slate-300',
    },
  ];

  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-3" aria-label={ariaLabel}>
      {cards.map((card) => {
        const CardIcon = card.icon;
        return (
          <article key={card.label} className={`${SURFACE_TOKENS.panel} p-4`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">{card.label}</span>
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full ${card.iconWrapClass}`}
              >
                <CardIcon className="h-4 w-4" />
              </span>
            </div>
            {loading ? (
              <div className="mt-2 h-8 w-14 animate-pulse rounded-lg bg-slate-200/80 dark:bg-slate-700/70" />
            ) : (
              <p className={`tabular-nums mt-2 text-2xl font-bold ${card.valueClass}`}>
                {card.value}
              </p>
            )}
          </article>
        );
      })}
    </section>
  );
}
