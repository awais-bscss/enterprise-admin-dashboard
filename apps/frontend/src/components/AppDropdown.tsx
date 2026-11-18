import { ChevronDown, type LucideIcon } from 'lucide-react';
import { DropdownPortal } from './dropdown/DropdownPortal';
import {
  getDropdownTriggerClass,
  useDropdownMenuState,
  type DropdownOption,
} from './dropdown/useDropdownMenuState';

export type { DropdownOption };

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
  searchable?: boolean;
  searchPlaceholder?: string;
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
  searchable = false,
  searchPlaceholder = 'Search...',
}: AppDropdownProps<T>) {
  const {
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
  } = useDropdownMenuState({
    variant,
    align,
    direction,
    compact,
    searchable,
    options,
  });

  const selectedOption = options.find((opt) => opt.value === value) ?? options[0];
  const ActiveIcon = TriggerIcon ?? selectedOption?.icon;

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
          if (disabled) return;
          if (open) closeMenu();
          else setOpen(true);
        }}
        aria-label={variant === 'icon' ? ariaLabel : undefined}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        className={getDropdownTriggerClass(variant, compact)}
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
              {variant === 'field' && selectedOption?.subtitle ? (
                <span className="truncate text-xs font-normal text-slate-400 dark:text-slate-500">
                  &middot; {selectedOption.subtitle}
                </span>
              ) : null}
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

      <DropdownPortal
        open={open}
        menuRef={menuRef}
        menuStyle={menuStyle}
        listboxId={listboxId}
        ariaLabel={ariaLabel}
        searchable={searchable}
        searchQuery={searchQuery}
        searchPlaceholder={searchPlaceholder}
        onSearchChange={setSearchQuery}
        visibleOptions={visibleOptions}
        emptyMessage="No matches found"
        isSelected={(optVal) => optVal === value}
        onSelect={(optVal) => {
          onChange(optVal);
          closeMenu();
        }}
      />
    </div>
  );
}

interface AppMultiSelectDropdownProps<T extends string = string> {
  id?: string;
  values: readonly T[];
  options: readonly DropdownOption<T>[];
  onToggle: (value: T) => void;
  onClear?: () => void;
  placeholder?: string;
  emptyMessage?: string;
  ariaLabel?: string;
  disabled?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  className?: string;
}

export function AppMultiSelectDropdown<T extends string = string>({
  id,
  values,
  options,
  onToggle,
  onClear,
  placeholder = 'Select options...',
  emptyMessage = 'No options available',
  ariaLabel,
  disabled = false,
  searchable = false,
  searchPlaceholder = 'Search...',
  className = '',
}: AppMultiSelectDropdownProps<T>) {
  const {
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
  } = useDropdownMenuState({
    variant: 'field',
    align: 'auto',
    direction: 'auto',
    compact: false,
    searchable,
    options,
  });

  const selectedOptions = options.filter((opt) => values.includes(opt.value));
  const summaryText =
    selectedOptions.length === 0
      ? placeholder
      : selectedOptions.length <= 2
        ? selectedOptions.map((opt) => opt.label).join(', ')
        : `${selectedOptions
            .slice(0, 2)
            .map((opt) => opt.label)
            .join(', ')} +${selectedOptions.length - 2} more`;

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          if (open) closeMenu();
          else setOpen(true);
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        className={getDropdownTriggerClass('field', false)}
      >
        {ariaLabel ? <span className="sr-only">{ariaLabel}: </span> : null}
        <span
          className={`min-w-0 truncate ${
            selectedOptions.length === 0 ? 'text-slate-400 dark:text-slate-500' : ''
          }`}
        >
          {summaryText}
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-slate-500 transition-transform dark:text-slate-400 ${
            open ? 'rotate-180' : ''
          }`}
          aria-hidden="true"
        />
      </button>

      <DropdownPortal
        open={open}
        menuRef={menuRef}
        menuStyle={menuStyle}
        listboxId={listboxId}
        ariaLabel={ariaLabel}
        searchable={searchable}
        searchQuery={searchQuery}
        searchPlaceholder={searchPlaceholder}
        onSearchChange={setSearchQuery}
        visibleOptions={visibleOptions}
        emptyMessage={emptyMessage}
        multiSelect
        isSelected={(optVal) => values.includes(optVal)}
        onSelect={onToggle}
        footer={
          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/70 px-2.5 py-1.5 text-[11px] dark:border-slate-800 dark:bg-slate-800/50">
            <span className="font-medium text-slate-500 dark:text-slate-400">
              {selectedOptions.length} selected
            </span>
            <div className="flex items-center gap-2">
              {onClear && selectedOptions.length > 0 ? (
                <button
                  type="button"
                  onClick={onClear}
                  className="cursor-pointer font-semibold text-rose-600 hover:underline dark:text-rose-400"
                >
                  Clear
                </button>
              ) : null}
              <button
                type="button"
                onClick={closeMenu}
                className="cursor-pointer font-semibold text-sky-700 hover:underline dark:text-sky-300"
              >
                Done
              </button>
            </div>
          </div>
        }
      />
    </div>
  );
}
