import { Save, Settings } from 'lucide-react';
import { AppDropdown, type DropdownOption } from '../../components/AppDropdown';
import { ErrorAlertBanner } from '../../components/ErrorAlertBanner';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { BUTTON_TOKENS, SURFACE_TOKENS } from '../../theme/tokens';
import { useWorkspaceSettings } from '../../hooks/useWorkspaceSettings';

const DEFAULT_ROLE_OPTIONS: readonly DropdownOption<'viewer' | 'manager'>[] = [
  { value: 'viewer', label: 'Viewer' },
  { value: 'manager', label: 'Manager' },
];

export function SettingsPage() {
  const {
    activeValues,
    updatedMeta,
    saving,
    retrying,
    error,
    updateDraftField,
    handleSubmit,
    handleRetry,
  } = useWorkspaceSettings();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-700 ring-1 ring-violet-100 dark:bg-violet-500/15 dark:text-violet-300 dark:ring-violet-500/30">
            <Settings className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              System Security Settings
            </h1>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
              Persistent organization security policies and session defaults.
            </p>
          </div>
        </div>

        {error ? (
          <ErrorAlertBanner
            message={error}
            onRetry={() => void handleRetry()}
            retrying={retrying}
          />
        ) : null}

        <form
          onSubmit={(e) => void handleSubmit(e)}
          className={`${SURFACE_TOKENS.card} max-w-2xl space-y-5 p-6`}
        >
          <div>
            <label
              htmlFor="org-name"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Organization Display Name
            </label>
            <input
              id="org-name"
              type="text"
              required
              minLength={2}
              value={activeValues.organizationName}
              onChange={(e) => updateDraftField('organizationName', e.target.value)}
              className={`mt-1.5 ${SURFACE_TOKENS.input}`}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label
                htmlFor="default-role"
                className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Default Invite Role
              </label>
              <AppDropdown<'viewer' | 'manager'>
                id="default-role"
                variant="field"
                value={activeValues.defaultNewUserRole}
                options={DEFAULT_ROLE_OPTIONS}
                onChange={(nextRole) => updateDraftField('defaultNewUserRole', nextRole)}
                ariaLabel="Default Invite Role"
              />
            </div>

            <div>
              <label
                htmlFor="session-ttl"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Access Token TTL (min)
              </label>
              <input
                id="session-ttl"
                type="number"
                min={5}
                max={120}
                value={activeValues.sessionTimeoutMinutes}
                onChange={(e) => updateDraftField('sessionTimeoutMinutes', Number(e.target.value))}
                className={`mt-1.5 py-2 ${SURFACE_TOKENS.input}`}
              />
            </div>

            <div>
              <label
                htmlFor="audit-days"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Audit Retention (days)
              </label>
              <input
                id="audit-days"
                type="number"
                min={7}
                max={365}
                value={activeValues.auditRetentionDays}
                onChange={(e) => updateDraftField('auditRetentionDays', Number(e.target.value))}
                className={`mt-1.5 py-2 ${SURFACE_TOKENS.input}`}
              />
            </div>
          </div>

          <label className="flex cursor-pointer items-center gap-3 rounded-2xl bg-surface-subtle p-3.5 text-sm text-slate-700 dark:text-slate-200">
            <input
              type="checkbox"
              checked={activeValues.enforceStrongPasswords}
              onChange={(e) => updateDraftField('enforceStrongPasswords', e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-sky-600 dark:border-slate-600"
            />
            <span>Require minimum 8+ character strong passwords for new accounts</span>
          </label>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
            <p className="text-xs text-slate-400">{updatedMeta ?? 'Stored in MongoDB Atlas'}</p>
            <button
              type="submit"
              disabled={saving}
              className={`${BUTTON_TOKENS.primarySoftPill} px-5 py-2.5`}
            >
              <Save className="h-3.5 w-3.5" />
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
