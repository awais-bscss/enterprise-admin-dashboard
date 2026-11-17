import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../components/toast/toastContext';
import { getErrorMessage } from '../lib/errors';
import { invalidateWorkspaceQueries, queryKeys } from '../lib/queryKeys';
import { workspaceService } from '../services/apiService';
import type { WorkspaceSettingsData } from '../types/auth';

export type SettingsDraft = Omit<WorkspaceSettingsData, 'updatedByName' | 'updatedAt'>;

const DEFAULT_SETTINGS: SettingsDraft = {
  organizationName: 'Veridian Enterprise',
  defaultNewUserRole: 'viewer',
  sessionTimeoutMinutes: 15,
  auditRetentionDays: 90,
  enforceStrongPasswords: true,
};

export function useWorkspaceSettings() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [draft, setDraft] = useState<SettingsDraft | null>(null);

  const settingsQuery = useQuery({
    queryKey: queryKeys.settings,
    queryFn: ({ signal }) => workspaceService.getSettings(signal),
  });

  const saveMutation = useMutation({
    mutationFn: (payload: SettingsDraft) => workspaceService.updateSettings(payload),
    onSuccess: async (updated) => {
      queryClient.setQueryData(queryKeys.settings, updated);
      setDraft(null);
      await invalidateWorkspaceQueries(queryClient, ['audit']);
      toast.success('Workspace security settings saved.');
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, 'Unable to save settings.'));
    },
  });

  const activeValues: SettingsDraft = draft ?? settingsQuery.data ?? DEFAULT_SETTINGS;
  const updatedMeta = settingsQuery.data
    ? `Last saved by ${settingsQuery.data.updatedByName} on ${new Date(settingsQuery.data.updatedAt).toLocaleString()}`
    : null;

  function updateDraftField<K extends keyof SettingsDraft>(field: K, value: SettingsDraft[K]) {
    setDraft({
      organizationName: activeValues.organizationName,
      defaultNewUserRole: activeValues.defaultNewUserRole,
      sessionTimeoutMinutes: activeValues.sessionTimeoutMinutes,
      auditRetentionDays: activeValues.auditRetentionDays,
      enforceStrongPasswords: activeValues.enforceStrongPasswords,
      [field]: value,
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await saveMutation
      .mutateAsync({
        organizationName: activeValues.organizationName.trim(),
        defaultNewUserRole: activeValues.defaultNewUserRole,
        sessionTimeoutMinutes: activeValues.sessionTimeoutMinutes,
        auditRetentionDays: activeValues.auditRetentionDays,
        enforceStrongPasswords: activeValues.enforceStrongPasswords,
      })
      .catch(() => undefined);
  }

  async function handleRetry() {
    saveMutation.reset();
    await settingsQuery.refetch();
  }

  return {
    activeValues,
    updatedMeta,
    saving: saveMutation.isPending,
    retrying: settingsQuery.isFetching,
    error: saveMutation.error
      ? getErrorMessage(saveMutation.error, 'Unable to save settings.')
      : settingsQuery.error
        ? getErrorMessage(settingsQuery.error, 'Unable to load security settings.')
        : null,
    updateDraftField,
    handleSubmit,
    handleRetry,
  };
}
