import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../components/toast/toastContext';
import { getErrorMessage } from '../lib/errors';
import { invalidateWorkspaceQueries } from '../lib/queryKeys';
import { validateEmail, validateMinLength } from '../lib/validation';
import { clientsService, type ClientInput } from '../services/apiService';
import type { ClientItem, EntityStatus } from '../types/auth';

export function useClientForm(
  client: ClientItem | null | undefined,
  onSaved: (client: ClientItem) => void,
) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const isEditing = Boolean(client);

  const [name, setName] = useState(client?.name ?? '');
  const [company, setCompany] = useState(client?.company ?? '');
  const [email, setEmail] = useState(client?.email ?? '');
  const [phone, setPhone] = useState(client?.phone ?? '');
  const [status, setStatus] = useState<EntityStatus>(client?.status ?? 'active');
  const [validationError, setValidationError] = useState<string | null>(null);

  const saveMutation = useMutation({
    mutationFn: (payload: ClientInput) =>
      client ? clientsService.update(client.id, payload) : clientsService.create(payload),
    onSuccess: (saved) => {
      void invalidateWorkspaceQueries(queryClient, ['clients', 'projects', 'dashboard', 'audit']);
      toast.success(isEditing ? `Updated client "${saved.name}".` : `Added client "${saved.name}".`);
      onSaved(saved);
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, 'Unable to save client.'));
    },
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const err =
      validateMinLength(name, 2, 'Contact name must be at least 2 characters.') ??
      validateMinLength(company, 2, 'Company name must be at least 2 characters.') ??
      validateEmail(email, 'Please enter a valid contact email.');
    if (err) {
      setValidationError(err);
      return;
    }

    setValidationError(null);
    await saveMutation
      .mutateAsync({
        name: name.trim(),
        company: company.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        status,
      })
      .catch(() => undefined);
  }

  return {
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
    submitting: saveMutation.isPending,
    error:
      validationError ??
      (saveMutation.error ? getErrorMessage(saveMutation.error, 'Unable to save client.') : null),
    handleSubmit,
  };
}
