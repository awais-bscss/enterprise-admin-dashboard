import { ChevronLeft, ChevronRight } from 'lucide-react';
import { BUTTON_TOKENS, SURFACE_TOKENS } from '../theme/tokens';
import type { PaginationMeta } from '../types/api';
import { AppDropdown } from './AppDropdown';

interface PaginationControlsProps {
  pagination: PaginationMeta;
  itemLabel?: string;
  limitOptions?: readonly number[];
  isFetching?: boolean;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
}

function buildPageSequence(current: number, totalPages: number): Array<number | 'ellipsis'> {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages: Array<number | 'ellipsis'> = [1];
  const windowStart = Math.max(2, current - 1);
  const windowEnd = Math.min(totalPages - 1, current + 1);

  if (windowStart > 2) {
    pages.push('ellipsis');
  }

  for (let page = windowStart; page <= windowEnd; page += 1) {
    pages.push(page);
  }

  if (windowEnd < totalPages - 1) {
    pages.push('ellipsis');
  }

  pages.push(totalPages);
  return pages;
}

export function PaginationControls({
  pagination,
  itemLabel = 'items',
  limitOptions = [6, 9, 12],
  isFetching = false,
  onPageChange,
  onLimitChange,
}: PaginationControlsProps) {
  const { page, limit, total, totalPages } = pagination;
  if (total === 0) return null;

  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);
  const sequence = buildPageSequence(page, totalPages);

  function selectPage(nextPage: number) {
    if (nextPage === page) return;
    onPageChange(nextPage);
    if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  return (
    <nav
      aria-label={`${itemLabel} pagination`}
      className={`${SURFACE_TOKENS.panel} flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5`}
    >
      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
        <span>
          Showing{' '}
          <span className="tabular-nums font-semibold text-slate-800 dark:text-slate-100">
            {startItem}&ndash;{endItem}
          </span>{' '}
          of <span className="tabular-nums font-semibold text-slate-800 dark:text-slate-100">{total}</span>{' '}
          {itemLabel}
        </span>

        {onLimitChange ? (
          <div className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span>Per page</span>
            <AppDropdown
              compact
              direction="up"
              value={String(limit)}
              options={limitOptions.map((option) => ({
                value: String(option),
                label: String(option),
              }))}
              onChange={(value) => onLimitChange(Number(value))}
              ariaLabel={`Select ${itemLabel} per page`}
            />
          </div>
        ) : null}

        {isFetching ? (
          <span className="text-[11px] font-medium text-sky-700 dark:text-sky-300">
            Updating...
          </span>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => selectPage(Math.max(1, page - 1))}
          disabled={page <= 1}
          className={`${BUTTON_TOKENS.secondaryPill} px-3 py-1.5`}
        >
          <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="sr-only sm:not-sr-only">Prev</span>{' '}
          <span className="sr-only">page</span>
        </button>

        {sequence.map((entry, idx) =>
          entry === 'ellipsis' ? (
            <span
              key={`ellipsis-${idx}`}
              className="px-1.5 text-xs text-slate-400 dark:text-slate-500"
            >
              &hellip;
            </span>
          ) : (
            <button
              key={entry}
              type="button"
              onClick={() => selectPage(entry)}
              aria-current={entry === page ? 'page' : undefined}
              className={`tabular-nums h-8 min-w-8 cursor-pointer rounded-full px-2.5 text-xs font-semibold transition ${
                entry === page
                  ? 'bg-sky-100 text-sky-900 ring-1 ring-sky-200/80 dark:bg-sky-500/25 dark:text-sky-100 dark:ring-sky-500/40'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100'
              }`}
            >
              {entry}
            </button>
          ),
        )}

        <button
          type="button"
          onClick={() => selectPage(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className={`${BUTTON_TOKENS.secondaryPill} px-3 py-1.5`}
        >
          <span className="sr-only sm:not-sr-only">Next</span>{' '}
          <span className="sr-only">page</span>
          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
}
