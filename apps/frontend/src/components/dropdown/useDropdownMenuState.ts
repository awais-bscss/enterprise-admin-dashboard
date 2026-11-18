import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import type { LucideIcon } from 'lucide-react';

export interface DropdownOption<T extends string = string> {
  value: T;
  label: string;
  subtitle?: string;
  badge?: string;
  icon?: LucideIcon;
}

export function getDropdownTriggerClass(
  variant: 'pill' | 'field' | 'icon',
  compact: boolean,
): string {
  if (variant === 'icon') {
    return 'inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-slate-200/80 bg-white text-slate-700 transition hover:bg-slate-50 focus:border-primary focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800/90 dark:text-slate-200 dark:hover:bg-slate-800';
  }
  if (variant === 'field') {
    return 'flex w-full cursor-pointer items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-slate-50/70 px-3.5 py-2 text-left text-sm text-slate-900 transition focus:border-primary focus:bg-white focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100 dark:focus:bg-slate-800';
  }
  return `inline-flex cursor-pointer items-center justify-between gap-2 rounded-full border border-slate-200 bg-slate-50 ${
    compact ? 'h-8 px-3 text-xs' : 'h-9 px-3.5 text-xs'
  } font-semibold text-slate-700 transition hover:bg-white focus:border-primary focus:bg-white focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-800/90`;
}

export function useDropdownMenuState<T extends string>({
  variant,
  align,
  direction,
  compact,
  searchable,
  options,
}: {
  variant: 'pill' | 'field' | 'icon';
  align: 'left' | 'right' | 'auto';
  direction: 'up' | 'down' | 'auto';
  compact: boolean;
  searchable: boolean;
  options: readonly DropdownOption<T>[];
}) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [menuStyle, setMenuStyle] = useState<CSSProperties | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const generatedId = useId();
  const listboxId = `${generatedId}-listbox`;

  const closeMenu = useCallback(() => {
    setOpen(false);
    setSearchQuery('');
  }, []);

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const visibleOptions =
    searchable && normalizedSearch
      ? options.filter((opt) =>
          [opt.label, opt.subtitle ?? '', opt.badge ?? '']
            .join(' ')
            .toLowerCase()
            .includes(normalizedSearch),
        )
      : options;

  const computeMenuPosition = useCallback(() => {
    const triggerEl = triggerRef.current;
    if (!triggerEl) return;

    const rect = triggerEl.getBoundingClientRect();
    const viewportMargin = 10;
    const minWidth = variant === 'field' ? rect.width : compact ? 92 : 148;
    const maxWidth = variant === 'field' ? Math.max(rect.width, 260) : compact ? 132 : 220;
    const menuWidth = Math.min(maxWidth, window.innerWidth - viewportMargin * 2);
    const actualWidth = Math.max(minWidth, menuWidth);
    const baseMaxHeight = searchable ? 268 : 196;
    const menuHeight = Math.min(options.length * 36 + (searchable ? 84 : 10), baseMaxHeight);

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
      112,
      Math.min(baseMaxHeight, openUp ? spaceAbove : spaceBelow),
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
  }, [align, compact, direction, options.length, searchable, variant]);

  useLayoutEffect(() => {
    if (!open) return;
    computeMenuPosition();
  }, [open, computeMenuPosition]);

  useEffect(() => {
    if (!open) return;

    function handleOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (!containerRef.current?.contains(target) && !menuRef.current?.contains(target)) {
        closeMenu();
      }
    }

    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        closeMenu();
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
  }, [open, closeMenu, computeMenuPosition]);

  return {
    open,
    setOpen,
    searchQuery,
    setSearchQuery,
    menuStyle,
    containerRef,
    triggerRef,
    menuRef,
    listboxId,
    closeMenu,
    visibleOptions,
  };
}

