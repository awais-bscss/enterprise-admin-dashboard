import type { CSSProperties, ReactNode, RefObject } from 'react';
import { createPortal } from 'react-dom';
import { Check, Search } from 'lucide-react';
import type { DropdownOption } from './useDropdownMenuState';

interface DropdownOptionRowProps<T extends string> {
  option: DropdownOption<T>;
  selected: boolean;
  multiSelect?: boolean;
  onSelect: (value: T) => void;
}

function DropdownOptionRow<T extends string>({
  option,
  selected,
  multiSelect = false,
  onSelect,
}: DropdownOptionRowProps<T>) {
  const OptionIcon = option.icon;

  return (
    <li role="none">
      <button
        type="button"
        role="option"
        aria-selected={selected}
        onClick={() => onSelect(option.value)}
        className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl px-2.5 py-1.5 text-left text-xs transition ${
          selected
            ? 'bg-primary-soft font-semibold text-primary-ink'
            : 'font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
        }`}
      >
        <span className="flex min-w-0 flex-1 items-center gap-2">
          {multiSelect ? (
            <span
              aria-hidden="true"
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition ${
                selected
                  ? 'border-sky-500 bg-sky-500 text-white dark:border-sky-400 dark:bg-sky-500'
                  : 'border-slate-300 bg-white dark:border-slate-600 dark:bg-slate-800'
              }`}
            >
              {selected ? <Check className="h-3 w-3" /> : null}
            </span>
          ) : OptionIcon ? (
            <OptionIcon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          ) : null}
          <span className="min-w-0 truncate">
            <span className="truncate">{option.label}</span>
            {option.subtitle ? (
              <span className="ml-1.5 text-[11px] font-normal text-slate-400 dark:text-slate-500">
                {option.subtitle}
              </span>
            ) : null}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-1.5">
          {option.badge ? (
            <span className="rounded-full bg-sky-50 px-1.5 py-0.5 text-[10px] font-semibold text-sky-700 dark:bg-sky-500/20 dark:text-sky-300">
              {option.badge}
            </span>
          ) : null}
          {!multiSelect && selected ? (
            <Check className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          ) : null}
        </span>
      </button>
    </li>
  );
}

interface DropdownPortalProps<T extends string> {
  open: boolean;
  menuRef: RefObject<HTMLDivElement | null>;
  menuStyle: CSSProperties | null;
  listboxId: string;
  ariaLabel?: string;
  searchable: boolean;
  searchQuery: string;
  searchPlaceholder: string;
  onSearchChange: (value: string) => void;
  visibleOptions: readonly DropdownOption<T>[];
  emptyMessage: string;
  multiSelect?: boolean;
  isSelected: (value: T) => boolean;
  onSelect: (value: T) => void;
  footer?: ReactNode;
}

export function DropdownPortal<T extends string>({
  open,
  menuRef,
  menuStyle,
  listboxId,
  ariaLabel,
  searchable,
  searchQuery,
  searchPlaceholder,
  onSearchChange,
  visibleOptions,
  emptyMessage,
  multiSelect = false,
  isSelected,
  onSelect,
  footer,
}: DropdownPortalProps<T>) {
  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      ref={menuRef}
      style={menuStyle ?? { position: 'fixed', visibility: 'hidden' }}
      className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900"
    >
      {searchable ? (
        <div className="border-b border-slate-100 p-1.5 dark:border-slate-800">
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              className="h-8 w-full rounded-xl border border-slate-200/80 bg-slate-50 pr-2.5 pl-8 text-xs text-slate-800 placeholder:text-slate-400 focus:border-sky-300 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
          </div>
        </div>
      ) : null}

      <ul
        id={listboxId}
        role="listbox"
        aria-label={ariaLabel}
        aria-multiselectable={multiSelect || undefined}
        className="flex-1 overflow-y-auto p-1"
      >
        {visibleOptions.length === 0 ? (
          <li className="px-3 py-2.5 text-center text-xs text-slate-400">{emptyMessage}</li>
        ) : (
          visibleOptions.map((option) => (
            <DropdownOptionRow
              key={option.value}
              option={option}
              selected={isSelected(option.value)}
              multiSelect={multiSelect}
              onSelect={onSelect}
            />
          ))
        )}
      </ul>
      {footer}
    </div>,
    document.body,
  );
}

