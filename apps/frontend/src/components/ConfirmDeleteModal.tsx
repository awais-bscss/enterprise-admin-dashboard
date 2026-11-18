import { useEffect } from 'react';
import { Trash2, X } from 'lucide-react';
import { BUTTON_TOKENS, SURFACE_TOKENS } from '../theme/tokens';
import { useModalScrollLock } from '../hooks/useModalScrollLock';

interface ConfirmDeleteModalProps {
  title: string;
  itemName: string;
  description: string;
  confirmLabel?: string;
  deleting?: boolean;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
}

export function ConfirmDeleteModal({
  title,
  itemName,
  description,
  confirmLabel = 'Delete',
  deleting = false,
  onCancel,
  onConfirm,
}: ConfirmDeleteModalProps) {
  useModalScrollLock(true);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !deleting) {
        onCancel();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [deleting, onCancel]);

  return (
    <div
      className={SURFACE_TOKENS.modalBackdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-delete-title"
    >
      <div className={`${SURFACE_TOKENS.modalCard} max-w-md`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-50 text-rose-600 ring-1 ring-rose-100 dark:bg-rose-500/15 dark:text-rose-300 dark:ring-rose-500/30">
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <h2
                id="confirm-delete-title"
                className="text-base font-bold text-slate-900 dark:text-slate-100"
              >
                {title}
              </h2>
              <p className="mt-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                {itemName}
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={deleting}
            onClick={onCancel}
            aria-label="Close modal"
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          {description}
        </p>

        <div className="mt-6 flex items-center justify-end gap-2.5 border-t border-slate-100 pt-4 dark:border-slate-800">
          <button
            type="button"
            disabled={deleting}
            onClick={onCancel}
            className={BUTTON_TOKENS.secondaryPill}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={deleting}
            onClick={() => void onConfirm()}
            className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-rose-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            {deleting ? 'Deleting...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
