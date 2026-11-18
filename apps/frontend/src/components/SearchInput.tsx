import { Search, X } from 'lucide-react';
import { useDebouncedSearch } from '../hooks/useDebouncedSearch';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  ariaLabel: string;
  className?: string;
}

export function SearchInput({
  value,
  onChange,
  placeholder,
  ariaLabel,
  className = 'w-full sm:w-80 xl:w-96',
}: SearchInputProps) {
  const [draft, setDraft] = useDebouncedSearch(value, onChange);

  return (
    <div className={`relative ${className}`}>
      <Search
        className="pointer-events-none absolute top-1/2 left-3.5 h-3.5 w-3.5 -translate-y-1/2 text-slate-400"
        aria-hidden="true"
      />
      <input
        type="search"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className="h-9 w-full rounded-full border border-slate-200 bg-slate-50/90 pr-8 pl-9 text-xs text-slate-800 placeholder:text-slate-500 focus:border-sky-300 focus:bg-white focus:ring-2 focus:ring-sky-100 focus:outline-none dark:border-slate-700 dark:bg-slate-800/90 dark:text-slate-100 dark:placeholder:text-slate-400 dark:focus:border-sky-500 dark:focus:bg-slate-800 dark:focus:ring-sky-500/20"
      />
      {draft ? (
        <button
          type="button"
          onClick={() => {
            setDraft('');
            onChange('');
          }}
          aria-label="Clear search"
          className="absolute top-1/2 right-2.5 -translate-y-1/2 cursor-pointer rounded-full p-0.5 text-slate-400 hover:bg-slate-200/70 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200"
        >
          <X className="h-3 w-3" />
        </button>
      ) : null}
    </div>
  );
}
