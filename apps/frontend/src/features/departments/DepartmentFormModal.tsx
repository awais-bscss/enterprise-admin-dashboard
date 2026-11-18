import { AlertCircle, Building2, X } from 'lucide-react';
import { AppDropdown, type DropdownOption } from '../../components/AppDropdown';
import { useDepartmentForm } from '../../hooks/useDepartmentForm';
import { useModalScrollLock } from '../../hooks/useModalScrollLock';
import { BUTTON_TOKENS, SURFACE_TOKENS } from '../../theme/tokens';
import type { DepartmentItem, EntityStatus } from '../../types/auth';

const STATUS_OPTIONS: readonly DropdownOption<EntityStatus>[] = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

interface DepartmentFormModalProps {
  department?: DepartmentItem | null;
  onClose: () => void;
  onSaved: (department: DepartmentItem) => void;
}

export function DepartmentFormModal({
  department,
  onClose,
  onSaved,
}: DepartmentFormModalProps) {
  useModalScrollLock(true);
  const {
    isEditing,
    name,
    setName,
    code,
    setCode,
    headName,
    setHeadName,
    description,
    setDescription,
    status,
    setStatus,
    submitting,
    error,
    handleSubmit,
  } = useDepartmentForm(department, onSaved);

  return (
    <div
      className={SURFACE_TOKENS.modalBackdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby="dept-modal-title"
    >
      <div className={`${SURFACE_TOKENS.modalCard} max-w-md`}>
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-50 text-violet-700 ring-1 ring-violet-100 dark:bg-violet-500/15 dark:text-violet-300 dark:ring-violet-500/30">
              <Building2 className="h-4 w-4" />
            </span>
            <div>
              <h2
                id="dept-modal-title"
                className="text-base font-bold text-slate-900 dark:text-slate-100"
              >
                {isEditing ? 'Edit Department' : 'Add Department'}
              </h2>
              <p className="text-xs text-slate-400">
                {isEditing
                  ? 'Update department leadership, code, and status.'
                  : 'Register an organizational department.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error ? (
          <div
            className={`mt-4 flex items-center gap-2 text-xs font-medium ${BUTTON_TOKENS.alertError}`}
            role="alert"
          >
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
            <span>{error}</span>
          </div>
        ) : null}

        <form className="mt-4 space-y-3.5" onSubmit={(e) => void handleSubmit(e)}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label
                htmlFor="dept-name"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Department Name
              </label>
              <input
                id="dept-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Platform Engineering"
                className={`mt-1.5 py-2 ${SURFACE_TOKENS.input}`}
              />
            </div>

            <div>
              <label
                htmlFor="dept-code"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Code
              </label>
              <input
                id="dept-code"
                type="text"
                required
                maxLength={16}
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="ENG"
                className={`mt-1.5 py-2 uppercase ${SURFACE_TOKENS.input}`}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label
                htmlFor="dept-head"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Department Head
              </label>
              <input
                id="dept-head"
                type="text"
                required
                value={headName}
                onChange={(e) => setHeadName(e.target.value)}
                placeholder="e.g., Alex Morgan"
                className={`mt-1.5 py-2 ${SURFACE_TOKENS.input}`}
              />
            </div>

            <div>
              <label
                htmlFor="dept-status"
                className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Status
              </label>
              <AppDropdown<EntityStatus>
                id="dept-status"
                variant="field"
                value={status}
                options={STATUS_OPTIONS}
                onChange={setStatus}
                ariaLabel="Status"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="dept-desc"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Description
            </label>
            <textarea
              id="dept-desc"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Core responsibilities or focus areas..."
              className={`mt-1.5 py-2 ${SURFACE_TOKENS.input}`}
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 pt-4 dark:border-slate-800">
            <button type="button" onClick={onClose} className={BUTTON_TOKENS.secondaryPill}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`${BUTTON_TOKENS.primarySoftPill} px-5`}
            >
              {submitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Department'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
