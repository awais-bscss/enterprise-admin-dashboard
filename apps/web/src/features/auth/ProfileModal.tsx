import { useState, type FormEvent } from 'react';
import { AlertCircle, CheckCircle2, KeyRound, UserCheck, X } from 'lucide-react';
import { getErrorMessage } from '../../lib/errors';
import { validateMinLength, validatePasswordMin } from '../../lib/validation';
import { SURFACE_TOKENS } from '../../theme/tokens';
import { useAuth } from './authContext';

interface ProfileModalProps {
  onClose: () => void;
}

export function ProfileModal({ onClose }: ProfileModalProps) {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();
    const validationError =
      validateMinLength(trimmedName, 2, 'Display name must be at least 2 characters.') ??
      (newPassword && !currentPassword
        ? 'Enter your current password to change your password.'
        : null) ??
      (newPassword
        ? validatePasswordMin(newPassword, 6, 'New password must be at least 6 characters.')
        : null);

    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError(null);
    setNotice(null);

    try {
      await updateProfile({
        name: trimmedName,
        ...(newPassword ? { currentPassword, newPassword } : {}),
      });
      setCurrentPassword('');
      setNewPassword('');
      setNotice('Profile saved.');
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to update profile.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className={SURFACE_TOKENS.modalBackdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-modal-title"
    >
      <div className={`${SURFACE_TOKENS.modalCard} max-w-md`}>
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-50 text-sky-700 ring-1 ring-sky-100">
              <UserCheck className="h-4 w-4" />
            </span>
            <div>
              <h2 id="profile-modal-title" className="text-base font-bold text-slate-900">
                My Account Profile
              </h2>
              <p className="text-xs text-slate-400">
                {user?.email} &middot;{' '}
                <span className="font-semibold text-sky-700 capitalize">{user?.role}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-slate-400 hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {notice ? (
          <div
            className="mt-4 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-semibold text-emerald-800"
            role="status"
          >
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>{notice}</span>
          </div>
        ) : null}

        {error ? (
          <div
            className="mt-4 flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-800"
            role="alert"
          >
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        ) : null}

        <form className="mt-4 space-y-4" onSubmit={(e) => void handleSubmit(e)}>
          <div>
            <label htmlFor="profile-name" className="block text-xs font-semibold text-slate-700">
              Display Name
            </label>
            <input
              id="profile-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1.5 block w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 text-sm text-slate-900 focus:border-sky-300 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
              <KeyRound className="h-3.5 w-3.5 text-slate-400" />
              Change Password (optional)
            </p>
            <div>
              <label htmlFor="profile-cur-pass" className="block text-[11px] font-medium text-slate-500">
                Current Password
              </label>
              <input
                id="profile-cur-pass"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="mt-1 block w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-sky-300 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="profile-new-pass" className="block text-[11px] font-medium text-slate-500">
                New Password
              </label>
              <input
                id="profile-new-pass"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 6+ characters (strong policy when enabled)"
                className="mt-1 block w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-sky-300 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={saving}
              className="cursor-pointer rounded-full border border-sky-200/90 bg-sky-100/90 px-5 py-2 text-xs font-semibold text-sky-900 hover:bg-sky-200/80 disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
