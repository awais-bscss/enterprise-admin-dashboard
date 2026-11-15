import { useEffect, useState, type FormEvent } from 'react';
import { CheckCircle2, Save, Settings } from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { getErrorMessage, isAbortError } from '../../lib/errors';
import { SURFACE_TOKENS } from '../../theme/tokens';
import { getWorkspaceSettings, updateWorkspaceSettings } from './workspaceApi';

export function SettingsPage() {
  const [organizationName, setOrganizationName] = useState('Veridian Enterprise');
  const [defaultNewUserRole, setDefaultNewUserRole] = useState<'manager' | 'viewer'>('viewer');
  const [sessionTimeoutMinutes, setSessionTimeoutMinutes] = useState(15);
  const [auditRetentionDays, setAuditRetentionDays] = useState(90);
  const [enforceStrongPasswords, setEnforceStrongPasswords] = useState(true);
  const [updatedMeta, setUpdatedMeta] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    getWorkspaceSettings(controller.signal)
      .then((settings) => {
        setOrganizationName(settings.organizationName);
        setDefaultNewUserRole(settings.defaultNewUserRole);
        setSessionTimeoutMinutes(settings.sessionTimeoutMinutes);
        setAuditRetentionDays(settings.auditRetentionDays);
        setEnforceStrongPasswords(settings.enforceStrongPasswords);
        setUpdatedMeta(
          `Last saved by ${settings.updatedByName} on ${new Date(settings.updatedAt).toLocaleString()}`,
        );
        setError(null);
      })
      .catch((err: unknown) => {
        if (isAbortError(err)) return;
        setError(getErrorMessage(err, 'Unable to load security settings.'));
      });

    return () => controller.abort();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setSavedNotice(null);
    setError(null);

    try {
      const updated = await updateWorkspaceSettings({
        organizationName: organizationName.trim(),
        defaultNewUserRole,
        sessionTimeoutMinutes,
        auditRetentionDays,
        enforceStrongPasswords,
      });
      setUpdatedMeta(
        `Last saved by ${updated.updatedByName} on ${new Date(updated.updatedAt).toLocaleString()}`,
      );
      setSavedNotice('Workspace security settings saved to MongoDB.');
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to save settings.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-700 ring-1 ring-violet-100">
            <Settings className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              System Security Settings
            </h1>
            <p className="mt-0.5 text-sm text-slate-500">
              Persistent organization security policies and session defaults.
            </p>
          </div>
        </div>

        {savedNotice ? (
          <div
            className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800"
            role="status"
          >
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>{savedNotice}</span>
          </div>
        ) : null}

        {error ? (
          <div
            className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
            role="alert"
          >
            {error}
          </div>
        ) : null}

        <form
          onSubmit={(e) => void handleSubmit(e)}
          className={`${SURFACE_TOKENS.card} max-w-2xl space-y-5 p-6`}
        >
          <div>
            <label htmlFor="org-name" className="block text-xs font-semibold text-slate-700">
              Organization Display Name
            </label>
            <input
              id="org-name"
              type="text"
              required
              minLength={2}
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
              className="mt-1.5 block w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 text-sm text-slate-900 focus:border-sky-300 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="default-role" className="block text-xs font-semibold text-slate-700">
                Default Invite Role
              </label>
              <select
                id="default-role"
                value={defaultNewUserRole}
                onChange={(e) => setDefaultNewUserRole(e.target.value as 'manager' | 'viewer')}
                className="mt-1.5 block w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-sm text-slate-900 focus:border-sky-300 focus:bg-white focus:outline-none"
              >
                <option value="viewer">Viewer</option>
                <option value="manager">Manager</option>
              </select>
            </div>

            <div>
              <label htmlFor="session-ttl" className="block text-xs font-semibold text-slate-700">
                Access Token TTL (min)
              </label>
              <input
                id="session-ttl"
                type="number"
                min={5}
                max={120}
                value={sessionTimeoutMinutes}
                onChange={(e) => setSessionTimeoutMinutes(Number(e.target.value))}
                className="mt-1.5 block w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-sm text-slate-900 focus:border-sky-300 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="audit-days" className="block text-xs font-semibold text-slate-700">
                Audit Retention (days)
              </label>
              <input
                id="audit-days"
                type="number"
                min={7}
                max={365}
                value={auditRetentionDays}
                onChange={(e) => setAuditRetentionDays(Number(e.target.value))}
                className="mt-1.5 block w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-sm text-slate-900 focus:border-sky-300 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <label className="flex cursor-pointer items-center gap-3 rounded-2xl bg-slate-50/80 p-3.5 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={enforceStrongPasswords}
              onChange={(e) => setEnforceStrongPasswords(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-sky-600"
            />
            <span>Require minimum 8+ character strong passwords for new accounts</span>
          </label>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
            <p className="text-xs text-slate-400">{updatedMeta ?? 'Stored in MongoDB Atlas'}</p>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-sky-200/90 bg-sky-100/90 px-5 py-2.5 text-xs font-semibold text-sky-900 transition hover:bg-sky-200/80 disabled:opacity-60"
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
