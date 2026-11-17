import { useState, type FormEvent } from 'react';
import { useToast } from '../components/toast/toastContext';
import { getErrorMessage } from '../lib/errors';
import { validateMinLength, validatePasswordMin } from '../lib/validation';
import { useAuth } from '../features/auth/authContext';

export function useProfileForm() {
  const { user, updateProfile } = useAuth();
  const toast = useToast();

  const [name, setName] = useState(user?.name ?? '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
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

    try {
      await updateProfile({
        name: trimmedName,
        ...(newPassword ? { currentPassword, newPassword } : {}),
      });
      setCurrentPassword('');
      setNewPassword('');
      toast.success('Profile changes saved.');
    } catch (err) {
      const message = getErrorMessage(err, 'Unable to update profile.');
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  return {
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
  };
}
