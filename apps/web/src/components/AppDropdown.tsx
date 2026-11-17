import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, type LucideIcon } from 'lucide-react';

export interface DropdownOption<T extends string = string> {
  value: T;
  label: string;
  icon?: LucideIcon;
}

interface AppDropdownProps<T extends string = string> {
  id?: string;
  value: T;
  options: readonly DropdownOption<T>[];
  onChange: (value: T) => void;
  ariaLabel?: string;
  disabled?: boolean;
  variant?: 'pill' | 'field' | 'icon';
  triggerIcon?: LucideIcon;
  align?: 'left' | 'right' | 'auto';
  direction?: 'up' | 'down' | 'auto';
  className?: string;
  compact?: boolean;
}

export function AppDropdown<T extends string = string>({
  id,
  value,
  options,
  onChange,
  ariaLabel,
  disabled = false,
  variant = 'pill',
  triggerIcon: TriggerIcon,
  align = 'auto',
  direction = 'auto',
  className = '',
  compact = false,
}: AppDropdownProps<T>) {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<CSSProperties | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const generatedId = useId();
  const listboxId = `${generatedId}-listbox`;

  const selectedOption = options.find((opt) => opt.value === value) ?? options[0];

  const computeMenuPosition = useCallback(() => {
    const triggerEl = triggerRef.current;
    if (!triggerEl) return;

    const rect = triggerEl.getBoundingClientRect();
    const viewportMargin = 10;
    const minWidth = variant === 'field' ? rect.width : compact ? 92 : 148;
    const maxWidth = variant === 'field' ? Math.max(rect.width, 220) : compact ? 132 : 204;
    const menuWidth = Math.min(maxWidth, window.innerWidth - viewportMargin * 2);
    const actualWidth = Math.max(minWidth, menuWidth);
    const menuHeight = Math.min(options.length * 32 + 10, 196);

    const spaceBelow = window.innerHeight - rect.bottom - viewportMargin;
    const spaceAbove = rect.top - viewportMargin;
    const openUp =
      direction === 'up' || (direction === 'auto' && spaceBelow < menuHeight && spaceAbove > spaceBelow);

    let left = align === 'right' ? rect.right - actualWidth : rect.left;
    if (align === 'auto' && rect.left + actualWidth > window.innerWidth - viewportMargin) {
      left = rect.right - actualWidth;
    }
    left = Math.max(viewportMargin, Math.min(left, window.innerWidth - actualWidth - viewportMargin));

    const maxAvailableHeight = Math.max(
      96,
      Math.min(196, openUp ? spaceAbove : spaceBelow),
    );

    const style: CSSProperties = {
      position: 'fixed',
      left,
      minWidth: Math.min(minWidth, window.innerWidth - viewportMargin * 2),
      maxWidth: actualWidth,
      maxHeight: maxAvailableHeight,
      zIndex: 70,
    };

    if (openUp) {
      style.bottom = window.innerHeight - rect.top + 6;
    } else {
      style.top = rect.bottom + 6;
    }

    setMenuStyle(style);
  }, [align, compact, direction, options.length, variant]);

  useLayoutEffect(() => {
    if (!open) return;
    computeMenuPosition();
  }, [open, computeMenuPosition]);

  useEffect(() => {
    if (!open) return;

    function handleOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        !containerRef.current?.contains(target) &&
        !menuRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    }

    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }

    function handleViewportChange() {
      computeMenuPosition();
    }

    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleKey);
    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('scroll', handleViewportChange, true);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleKey);
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('scroll', handleViewportChange, true);
    };
  }, [open, computeMenuPosition]);

  const triggerClass =
    variant === 'icon'
      ? 'inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-slate-200/80 bg-white text-slate-700 transition hover:bg-slate-50 focus:border-primary focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800/90 dark:text-slate-200 dark:hover:bg-slate-800'
      : variant === 'field'
        ? 'flex w-full cursor-pointer items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-slate-50/70 px-3.5 py-2 text-left text-sm text-slate-900 transition focus:border-primary focus:bg-white focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100 dark:focus:bg-slate-800'
        : `inline-flex cursor-pointer items-center justify-between gap-2 rounded-full border border-slate-200 bg-slate-50 ${
            compact ? 'h-8 px-3 text-xs' : 'h-9 px-3.5 text-xs'
          } font-semibold text-slate-700 transition hover:bg-white focus:border-primary focus:bg-white focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-800/90`;

  const ActiveIcon = TriggerIcon ?? selectedOption?.icon;

  const menu =
    open && typeof document !== 'undefined'
      ? createPortal(
          <ul
            ref={menuRef}
            id={listboxId}
            role="listbox"
            aria-label={ariaLabel}
            style={menuStyle ?? { position: 'fixed', visibility: 'hidden' }}
            className="overflow-y-auto rounded-2xl border border-slate-200 bg-white p-1 shadow-xl dark:border-slate-700 dark:bg-slate-900"
          >
            {options.map((option) => {
              const isSelected = option.value === value;
              const OptionIcon = option.icon;

              return (
                <li key={option.value} role="none">
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                    className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl px-2.5 py-1.5 text-left text-xs transition ${
                      isSelected
                        ? 'bg-primary-soft font-semibold text-primary-ink'
                        : 'font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="flex min-w-0 items-center gap-2 truncate">
                      {OptionIcon ? (
                        <OptionIcon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      ) : null}
                      <span className="truncate">{option.label}</span>
                    </span>
                    {isSelected ? <Check className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /> : null}
                  </button>
                </li>
              );
            })}
          </ul>,
          document.body,
        )
      : null;

  return (
    <div
      ref={containerRef}
      className={`relative ${variant === 'field' ? 'w-full' : 'inline-block'} ${className}`}
    >
      <button
        ref={triggerRef}
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) setOpen((prev) => !prev);
        }}
        aria-label={variant === 'icon' ? ariaLabel : undefined}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        className={triggerClass}
      >
        {variant === 'icon' ? (
          ActiveIcon ? (
            <ActiveIcon className="h-4 w-4" aria-hidden="true" />
          ) : null
        ) : (
          <>
            {ariaLabel ? <span className="sr-only">{ariaLabel}: </span> : null}
            <span className="flex min-w-0 items-center gap-1.5 truncate">
              {ActiveIcon ? (
                <ActiveIcon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              ) : null}
              <span className="truncate">{selectedOption?.label ?? ''}</span>
            </span>
            <ChevronDown
              className={`h-3.5 w-3.5 shrink-0 text-slate-500 transition-transform dark:text-slate-400 ${
                open ? 'rotate-180' : ''
              }`}
              aria-hidden="true"
            />
          </>
        )}
      </button>
      {menu}
    </div>
  );
}
