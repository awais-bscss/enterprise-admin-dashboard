import { AlertCircle, FileUp, Upload, X } from 'lucide-react';
import { BUTTON_TOKENS, SURFACE_TOKENS } from '../../theme/tokens';
import { useModalScrollLock } from '../../hooks/useModalScrollLock';
import { useProjectImport } from '../../hooks/useProjectImport';

interface ImportProjectsModalProps {
  onClose: () => void;
  onImported: () => void;
}

export function ImportProjectsModal({ onClose, onImported }: ImportProjectsModalProps) {
  useModalScrollLock(true);
  const { fileName, items, skippedCount, error, uploading, handleFileChange, handleUpload } =
    useProjectImport(onImported);

  return (
    <div
      className={SURFACE_TOKENS.modalBackdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-projects-title"
    >
      <div className={`${SURFACE_TOKENS.modalCard} max-w-lg`}>
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/30">
              <FileUp className="h-4 w-4" />
            </span>
            <div>
              <h2
                id="import-projects-title"
                className="text-base font-bold text-slate-900 dark:text-slate-100"
              >
                Import Projects Batch
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Upload a `.json` or `.csv` file (max 90 KB, up to 25 projects).
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <label
            htmlFor="projects-upload-input"
            className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-surface-subtle px-4 py-6 text-center transition hover:border-sky-400 dark:border-slate-700 dark:hover:border-sky-500"
          >
            <Upload className="h-5 w-5 text-sky-600 dark:text-sky-400" />
            <span className="mt-2 text-xs font-semibold text-slate-800 dark:text-slate-100">
              {fileName ? fileName : 'Choose a .json or .csv file'}
            </span>
            <span className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              Required column/property: name. Optional: description, category, status, priority.
            </span>
            <input
              id="projects-upload-input"
              type="file"
              accept=".json,.csv,application/json,text/csv"
              onChange={(e) => void handleFileChange(e)}
              className="sr-only"
            />
          </label>

          {error ? (
            <div
              className={`flex items-center gap-2 text-xs font-medium ${BUTTON_TOKENS.alertError}`}
              role="alert"
            >
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
              <span>{error}</span>
            </div>
          ) : null}

          {items.length > 0 ? (
            <div className="rounded-2xl border border-slate-200/80 bg-surface-subtle p-3.5 text-xs dark:border-slate-700/80">
              <p className="font-semibold text-slate-800 dark:text-slate-100">
                Ready to import {items.length} project(s)
                {skippedCount > 0 ? ` (${skippedCount} invalid or capped row(s) skipped)` : ''}
              </p>
              <ul className="mt-2 max-h-28 space-y-1 overflow-y-auto text-slate-600 dark:text-slate-300">
                {items.map((item, idx) => (
                  <li key={`${item.name}-${idx}`} className="truncate">
                    &bull; {item.name} ({item.category}, {item.status})
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 pt-4 dark:border-slate-800">
            <button type="button" onClick={onClose} className={BUTTON_TOKENS.secondaryPill}>
              Cancel
            </button>
            <button
              type="button"
              disabled={uploading || items.length === 0 || Boolean(error)}
              onClick={() => void handleUpload()}
              className={`${BUTTON_TOKENS.primarySoftPill} px-5`}
            >
              {uploading ? 'Uploading...' : 'Upload Batch'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
