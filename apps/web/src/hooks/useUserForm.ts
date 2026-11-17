import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../components/toast/toastContext';
import { getErrorMessage } from '../lib/errors';
import { invalidateWorkspaceQueries } from '../lib/queryKeys';
import { validateEmail, validateMinLength, validatePasswordMin } from '../lib/validation';
import { usersService } from '../services/apiService';
import type { DirectoryPreviewUser, Role } from '../types/auth';

export function useUserForm(
  member: DirectoryPreviewUser | null | undefined,
  currentUserId: string | undefined,
  onSaved: (user: DirectoryPreviewUser) => void,
) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const isEditing = Boolean(member);
  const isSelf = Boolean(member && member.id === currentUserId);

  const [name, setName] = useState(member?.name ?? '');
  const [email, setEmail] = useState(member?.email ?? '');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>(member?.role ?? 'viewer');
  const [status, setStatus] = useState<'active' | 'suspended'>(member?.status ?? 'active');
  const [validationError, setValidationError] = useState<string | null>(null);

  const saveMutation = useMutation({
    mutationFn: ({
      trimmedName,
      trimmedEmail,
    }: {
      trimmedName: string;
      trimmedEmail: string;
    }) =>
      member
        ? usersService.update(member.id, {
            name: trimmedName,
            email: trimmedEmail,
            ...(isSelf ? {} : { role, status }),
            ...(password ? { password } : {}),
          })
        : usersService.create({
            name: trimmedName,
            email: trimmedEmail,
            password,
            role,
            status,
          }),
    onSuccess: (saved) => {
      void invalidateWorkspaceQueries(queryClient, ['users', 'dashboard', 'projects', 'audit']);
      toast.success(
        isEditing ? `Updated member "${saved.name}".` : `Created user "${saved.name}".`,
      );
      onSaved(saved);
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, 'Unable to save user.'));
    },
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    const nextValidationError =
      validateMinLength(trimmedName, 2, 'Full name must be at least 2 characters.') ??
      validateEmail(trimmedEmail) ??
      (!isEditing
        ? validatePasswordMin(password, 6, 'Initial password must be at least 6 characters.')
        : password
          ? validatePasswordMin(password, 6, 'Replacement password must be at least 6 characters.')
          : null);

    if (nextValidationError) {
      setValidationError(nextValidationError);
      return;
    }

    setValidationError(null);
    await saveMutation.mutateAsync({ trimmedName, trimmedEmail }).catch(() => undefined);
  }

  return {
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
    submitting: saveMutation.isPending,
    error:
      validationError ??
      (saveMutation.error ? getErrorMessage(saveMutation.error, 'Unable to save user.') : null),
    handleSubmit,
  };
}
