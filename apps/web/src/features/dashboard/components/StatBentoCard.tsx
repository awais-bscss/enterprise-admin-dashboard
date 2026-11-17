import type { ReactNode } from 'react';
import { ArrowUpRight, type LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BENTO_TONE_TOKENS, SURFACE_TOKENS, type BentoTone } from '../../../theme/tokens';

export type { BentoTone };

interface StatBentoCardProps {
  title: string;
  value: string | number;
  delta?: string;
  footerLabel: string;
  to: string;
  tone: BentoTone;
  icon: LucideIcon;
  rightSlot?: ReactNode;
}

export function StatBentoCard({
  title,
  value,
  delta,
  footerLabel,
  to,
  tone,
  icon: Icon,
  rightSlot,
}: StatBentoCardProps) {
  const styles = BENTO_TONE_TOKENS[tone];

  return (
    <article className={`${SURFACE_TOKENS.cardInteractive} flex flex-col justify-between p-5`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ring-1 ${styles.ring} ${styles.iconBg} ${styles.iconText}`}
          >
            <Icon className="h-4 w-4" />
          </div>
          <h2 className="text-sm font-medium text-slate-600 dark:text-slate-300">{title}</h2>
        </div>

        <Link
          to={to}
          aria-label={`Open ${title}`}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100/80 text-slate-600 transition hover:bg-sky-50 hover:text-sky-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-sky-500/20 dark:hover:text-sky-300"
        >
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="my-5 flex items-baseline gap-2.5">
        <p className="tabular-nums text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          {value}
        </p>
        {delta ? (
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${styles.badgeBg} ${styles.badgeText}`}
          >
            {delta}
          </span>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-3.5 dark:border-slate-800">
        <span className="text-xs font-medium text-slate-400">{footerLabel}</span>
        {rightSlot}
      </div>
    </article>
  );
}
