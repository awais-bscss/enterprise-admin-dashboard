import { AlertCircle, KeyRound, UserCheck, X } from 'lucide-react';
import { BUTTON_TOKENS, SURFACE_TOKENS } from '../../theme/tokens';
import { useModalScrollLock } from '../../hooks/useModalScrollLock';
import { useProfileForm } from '../../hooks/useProfileForm';

interface ProfileModalProps {
  onClose: () => void;
}

export function ProfileModal({ onClose }: ProfileModalProps) {
  useModalScrollLock(true);
  const {
    user,
    name,
    setName,
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    saving,
    error,
    handleSubmit,
  } = useProfileForm();

  return (
    <div
      className={SURFACE_TOKENS.modalBackdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-modal-title"
    >
      <div className={`${SURFACE_TOKENS.modalCard} max-w-md`}>
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-50 text-sky-700 ring-1 ring-sky-100 dark:bg-sky-500/15 dark:text-sky-300 dark:ring-sky-500/30">
              <UserCheck className="h-4 w-4" />
            </span>
            <div>
              <h2
                id="profile-modal-title"
                className="text-base font-bold text-slate-900 dark:text-slate-100"
              >
                My Account Profile
              </h2>
              <p className="text-xs text-slate-400">
                {user?.email} &middot;{' '}
                <span className="font-semibold text-sky-700 capitalize dark:text-sky-300">
                  {user?.role}
                </span>
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

        <form className="mt-4 space-y-4" onSubmit={(e) => void handleSubmit(e)}>
          <div>
            <label
              htmlFor="profile-name"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Display Name
            </label>
            <input
              id="profile-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`mt-1.5 ${SURFACE_TOKENS.input}`}
            />
          </div>

          <div className="space-y-3 rounded-2xl border border-slate-100 bg-surface-subtle p-3.5 dark:border-slate-800">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <KeyRound className="h-3.5 w-3.5 text-slate-400" />
              Change Password (optional)
            </p>
            <div>
              <label
                htmlFor="profile-cur-pass"
                className="block text-[11px] font-medium text-slate-500 dark:text-slate-400"
              >
                Current Password
              </label>
              <input
                id="profile-cur-pass"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className={`mt-1 py-2 ${SURFACE_TOKENS.input}`}
              />
            </div>
            <div>
              <label
                htmlFor="profile-new-pass"
                className="block text-[11px] font-medium text-slate-500 dark:text-slate-400"
              >
                New Password
              </label>
              <input
                id="profile-new-pass"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 6+ characters (strong policy when enabled)"
                className={`mt-1 py-2 ${SURFACE_TOKENS.input}`}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
            <button type="button" onClick={onClose} className={BUTTON_TOKENS.secondaryPill}>
              Close
            </button>
            <button
              type="submit"
              disabled={saving}
              className={`${BUTTON_TOKENS.primarySoftPill} px-5`}
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
