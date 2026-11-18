import { AlertCircle, Briefcase, X } from 'lucide-react';
import { AppDropdown, type DropdownOption } from '../../components/AppDropdown';
import { useClientForm } from '../../hooks/useClientForm';
import { useModalScrollLock } from '../../hooks/useModalScrollLock';
import { BUTTON_TOKENS, SURFACE_TOKENS } from '../../theme/tokens';
import type { ClientItem, EntityStatus } from '../../types/auth';

const STATUS_OPTIONS: readonly DropdownOption<EntityStatus>[] = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

interface ClientFormModalProps {
  client?: ClientItem | null;
  onClose: () => void;
  onSaved: (client: ClientItem) => void;
}

export function ClientFormModal({ client, onClose, onSaved }: ClientFormModalProps) {
  useModalScrollLock(true);
  const {
    isEditing,
    name,
    setName,
    company,
    setCompany,
    email,
    setEmail,
    phone,
    setPhone,
    status,
    setStatus,
    submitting,
    error,
    handleSubmit,
  } = useClientForm(client, onSaved);

  return (
    <div
      className={SURFACE_TOKENS.modalBackdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby="client-modal-title"
    >
      <div className={`${SURFACE_TOKENS.modalCard} max-w-md`}>
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100 dark:bg-cyan-500/15 dark:text-cyan-300 dark:ring-cyan-500/30">
              <Briefcase className="h-4 w-4" />
            </span>
            <div>
              <h2
                id="client-modal-title"
                className="text-base font-bold text-slate-900 dark:text-slate-100"
              >
                {isEditing ? 'Edit Client' : 'Add Client'}
              </h2>
              <p className="text-xs text-slate-400">
                {isEditing
                  ? 'Update client contact info, company, and status.'
                  : 'Register a client account for workspace management.'}
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
          <div>
            <label
              htmlFor="client-name"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Contact Name
            </label>
            <input
              id="client-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Elena Rostova"
              className={`mt-1.5 py-2 ${SURFACE_TOKENS.input}`}
            />
          </div>

          <div>
            <label
              htmlFor="client-company"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Company
            </label>
            <input
              id="client-company"
              type="text"
              required
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="e.g., Northstar Logistics"
              className={`mt-1.5 py-2 ${SURFACE_TOKENS.input}`}
            />
          </div>

          <div>
            <label
              htmlFor="client-email"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Email
            </label>
            <input
              id="client-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="client@company.com"
              className={`mt-1.5 py-2 ${SURFACE_TOKENS.input}`}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label
                htmlFor="client-phone"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Phone
              </label>
              <input
                id="client-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1-555-0142"
                className={`mt-1.5 py-2 ${SURFACE_TOKENS.input}`}
              />
            </div>

            <div>
              <label
                htmlFor="client-status"
                className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Status
              </label>
              <AppDropdown<EntityStatus>
                id="client-status"
                variant="field"
                value={status}
                options={STATUS_OPTIONS}
                onChange={setStatus}
                ariaLabel="Status"
              />
            </div>
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
              {submitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
