import { AlertCircle, UserCog, UserPlus, X } from 'lucide-react';
import { AppDropdown, type DropdownOption } from '../../components/AppDropdown';
import { BUTTON_TOKENS, SURFACE_TOKENS } from '../../theme/tokens';
import type { DirectoryPreviewUser, Role } from '../../types/auth';
import { useModalScrollLock } from '../../hooks/useModalScrollLock';
import { useUserForm } from '../../hooks/useUserForm';

const MODAL_ROLE_OPTIONS: readonly DropdownOption<Role>[] = [
  { value: 'viewer', label: 'Viewer' },
  { value: 'manager', label: 'Manager' },
  { value: 'admin', label: 'Admin' },
];

const MODAL_STATUS_OPTIONS: readonly DropdownOption<'active' | 'suspended'>[] = [
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
];

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
  useModalScrollLock(true);
  const {
    isEditing,
    isSelf,
    name,
    setName,
    email,
    setEmail,
    password,
    setPassword,
    role,
    setRole,
    status,
    setStatus,
    departmentId,
    setDepartmentId,
    departments,
    submitting,
    error,
    handleSubmit,
  } = useUserForm(member, currentUserId, onSaved);

  return (
    <div
      className={SURFACE_TOKENS.modalBackdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby="user-modal-title"
    >
      <div className={`${SURFACE_TOKENS.modalCard} max-w-md`}>
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-50 text-sky-700 ring-1 ring-sky-100 dark:bg-sky-500/15 dark:text-sky-300 dark:ring-sky-500/30">
              {isEditing ? <UserCog className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
            </span>
            <div>
              <h2
                id="user-modal-title"
                className="text-base font-bold text-slate-900 dark:text-slate-100"
              >
                {isEditing ? 'Edit Employee' : 'Add Employee'}
              </h2>
              <p className="text-xs text-slate-400">
                {isEditing
                  ? 'Update employee details, department, role, or reset password.'
                  : 'Create an employee account with department and role-scoped access.'}
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
              htmlFor="user-modal-name"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Full Name
            </label>
            <input
              id="user-modal-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Sara Ahmed"
              className={`mt-1 py-2 ${SURFACE_TOKENS.input}`}
            />
          </div>

          <div>
            <label
              htmlFor="user-modal-email"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Work Email
            </label>
            <input
              id="user-modal-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="member@company.com"
              className={`mt-1 py-2 ${SURFACE_TOKENS.input}`}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label
                htmlFor="user-modal-role"
                className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Role
              </label>
              <AppDropdown<Role>
                id="user-modal-role"
                variant="field"
                value={role}
                disabled={isSelf}
                options={MODAL_ROLE_OPTIONS}
                onChange={setRole}
                ariaLabel="Role"
              />
            </div>

            <div>
              <label
                htmlFor="user-modal-status"
                className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Status
              </label>
              <AppDropdown<'active' | 'suspended'>
                id="user-modal-status"
                variant="field"
                value={status}
                disabled={isSelf}
                options={MODAL_STATUS_OPTIONS}
                onChange={setStatus}
                ariaLabel="Status"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="user-modal-dept"
              className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Department
            </label>
            <AppDropdown
              id="user-modal-dept"
              variant="field"
              searchable
              searchPlaceholder="Search departments..."
              value={departmentId}
              options={[
                { value: '', label: 'Unassigned' },
                ...departments.map((dept) => ({
                  value: dept.id,
                  label: `${dept.name} (${dept.code})`,
                })),
              ]}
              onChange={setDepartmentId}
              ariaLabel="Department"
            />
          </div>

          <div>
            <label
              htmlFor="user-modal-pass"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              {isEditing ? 'Reset Password (optional)' : 'Initial Password'}
            </label>
            <input
              id="user-modal-pass"
              type="password"
              required={!isEditing}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={
                isEditing ? 'Leave empty to keep current password' : 'Minimum 8 characters'
              }
              className={`mt-1 py-2 ${SURFACE_TOKENS.input}`}
            />
            <p className="mt-1 text-[11px] text-slate-400">
              Use 8+ chars with upper, lower, and a number when strong passwords are enabled.
            </p>
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
            <button type="button" onClick={onClose} className={BUTTON_TOKENS.secondaryPill}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`${BUTTON_TOKENS.primarySoftPill} px-5`}
            >
              {submitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
