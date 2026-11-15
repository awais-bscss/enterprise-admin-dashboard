import { useState, type FormEvent } from 'react';
import { AlertCircle, UserCog, UserPlus, X } from 'lucide-react';
import { getErrorMessage } from '../../lib/errors';
import { validateEmail, validateMinLength, validatePasswordMin } from '../../lib/validation';
import { SURFACE_TOKENS } from '../../theme/tokens';
import type { DirectoryPreviewUser, Role } from '../../types/auth';
import { createUser, updateUser } from './usersApi';

interface UserFormModalProps {
  member?: DirectoryPreviewUser | null;
  currentUserId?: string;
  onClose: () => void;
  onSaved: (user: DirectoryPreviewUser) => void;
}

export function UserFormModal({
  member,
  currentUserId,
  onClose,
  onSaved,
}: UserFormModalProps) {
  const isEditing = Boolean(member);
  const isSelf = Boolean(member && member.id === currentUserId);

  const [name, setName] = useState(member?.name ?? '');
  const [email, setEmail] = useState(member?.email ?? '');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>(member?.role ?? 'viewer');
  const [status, setStatus] = useState<'active' | 'suspended'>(member?.status ?? 'active');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    const validationError =
      validateMinLength(trimmedName, 2, 'Full name must be at least 2 characters.') ??
      validateEmail(trimmedEmail) ??
      (!isEditing
        ? validatePasswordMin(password, 6, 'Initial password must be at least 6 characters.')
        : password
          ? validatePasswordMin(password, 6, 'Replacement password must be at least 6 characters.')
          : null);

    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const saved = member
        ? await updateUser(member.id, {
            name: trimmedName,
            email: trimmedEmail,
            ...(isSelf ? {} : { role, status }),
            ...(password ? { password } : {}),
          })
        : await createUser({
            name: trimmedName,
            email: trimmedEmail,
            password,
            role,
            status,
          });

      onSaved(saved);
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to save user.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className={SURFACE_TOKENS.modalBackdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby="user-modal-title"
    >
      <div className={`${SURFACE_TOKENS.modalCard} max-w-md`}>
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-50 text-sky-700 ring-1 ring-sky-100">
              {isEditing ? <UserCog className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
            </span>
            <div>
              <h2 id="user-modal-title" className="text-base font-bold text-slate-900">
                {isEditing ? 'Edit Team Member' : 'Add Team Member'}
              </h2>
              <p className="text-xs text-slate-400">
                {isEditing
                  ? 'Update account details, RBAC tier, or reset password.'
                  : 'Create an enterprise account with role-scoped access.'}
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

        {error ? (
          <div
            className="mt-4 flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-800"
            role="alert"
          >
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        ) : null}

        <form className="mt-4 space-y-3.5" onSubmit={(e) => void handleSubmit(e)}>
          <div>
            <label htmlFor="user-modal-name" className="block text-xs font-semibold text-slate-700">
              Full Name
            </label>
            <input
              id="user-modal-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Sara Ahmed"
              className="mt-1 block w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-3.5 py-2 text-sm focus:border-sky-300 focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="user-modal-email" className="block text-xs font-semibold text-slate-700">
              Work Email
            </label>
            <input
              id="user-modal-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="sara@enterprise.dev"
              className="mt-1 block w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-3.5 py-2 text-sm focus:border-sky-300 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="user-modal-role" className="block text-xs font-semibold text-slate-700">
                Role
              </label>
              <select
                id="user-modal-role"
                value={role}
                disabled={isSelf}
                onChange={(e) => setRole(e.target.value as Role)}
                className="mt-1 block w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-sm focus:border-sky-300 focus:bg-white focus:outline-none disabled:opacity-60"
              >
                <option value="viewer">Viewer</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div>
              <label htmlFor="user-modal-status" className="block text-xs font-semibold text-slate-700">
                Status
              </label>
              <select
                id="user-modal-status"
                value={status}
                disabled={isSelf}
                onChange={(e) => setStatus(e.target.value as 'active' | 'suspended')}
                className="mt-1 block w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-sm focus:border-sky-300 focus:bg-white focus:outline-none disabled:opacity-60"
              >
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="user-modal-pass" className="block text-xs font-semibold text-slate-700">
              {isEditing ? 'Reset Password (optional)' : 'Initial Password'}
            </label>
            <input
              id="user-modal-pass"
              type="password"
              required={!isEditing}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={
                isEditing ? 'Leave empty to keep current password' : 'e.g., User@12345'
              }
              className="mt-1 block w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-3.5 py-2 text-sm focus:border-sky-300 focus:bg-white focus:outline-none"
            />
            <p className="mt-1 text-[11px] text-slate-400">
              Use 8+ chars with upper, lower, and a number when strong passwords are enabled.
            </p>
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="cursor-pointer rounded-full border border-sky-200/90 bg-sky-100/90 px-5 py-2 text-xs font-semibold text-sky-900 hover:bg-sky-200/80 disabled:opacity-60"
            >
              {submitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
