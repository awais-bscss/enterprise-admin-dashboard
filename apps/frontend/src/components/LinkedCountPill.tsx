import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface LinkedCountPillProps {
  count: number;
  singular: string;
  plural: string;
  to: string;
  title?: string;
}

export function LinkedCountPill({
  count,
  singular,
  plural,
  to,
  title,
}: LinkedCountPillProps) {
  if (count <= 0) {
    return <span className="text-xs text-slate-400">None</span>;
  }

  return (
    <Link
      to={to}
      title={title}
      className="tabular-nums inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-semibold text-sky-700 ring-1 ring-sky-200/70 transition hover:bg-sky-100 dark:bg-sky-500/15 dark:text-sky-300 dark:ring-sky-500/30 dark:hover:bg-sky-500/25"
    >
      <span>
        {count} {count === 1 ? singular : plural}
      </span>
      <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
    </Link>
  );
}

