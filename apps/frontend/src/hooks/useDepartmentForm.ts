import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../components/toast/toastContext';
import { getErrorMessage } from '../lib/errors';
import { invalidateWorkspaceQueries } from '../lib/queryKeys';
import { validateMinLength } from '../lib/validation';
import { departmentsService, type DepartmentInput } from '../services/apiService';
import type { DepartmentItem, EntityStatus } from '../types/auth';

export function useDepartmentForm(
  department: DepartmentItem | null | undefined,
  onSaved: (department: DepartmentItem) => void,
) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const isEditing = Boolean(department);

  const [name, setName] = useState(department?.name ?? '');
  const [code, setCode] = useState(department?.code ?? '');
  const [headName, setHeadName] = useState(department?.headName ?? '');
  const [description, setDescription] = useState(department?.description ?? '');
  const [status, setStatus] = useState<EntityStatus>(department?.status ?? 'active');
  const [validationError, setValidationError] = useState<string | null>(null);

  const saveMutation = useMutation({
    mutationFn: (payload: DepartmentInput) =>
      department
        ? departmentsService.update(department.id, payload)
        : departmentsService.create(payload),
    onSuccess: (saved) => {
      void invalidateWorkspaceQueries(queryClient, [
        'departments',
        'projects',
        'users',
        'dashboard',
        'audit',
      ]);
      toast.success(
        isEditing ? `Updated department "${saved.name}".` : `Created department "${saved.name}".`,
      );
      onSaved(saved);
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, 'Unable to save department.'));
    },
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const err =
      validateMinLength(name, 2, 'Department name must be at least 2 characters.') ??
      validateMinLength(code, 2, 'Department code must be at least 2 characters.') ??
      validateMinLength(headName, 2, 'Department head must be at least 2 characters.');
    if (err) {
      setValidationError(err);
      return;
    }

    setValidationError(null);
    await saveMutation
      .mutateAsync({
        name: name.trim(),
        code: code.trim().toUpperCase(),
        headName: headName.trim(),
        description: description.trim(),
        status,
      })
      .catch(() => undefined);
  }

  return {
    isEditing,
    name,
    setName,
    code,
    setCode,
    headName,
    setHeadName,
    description,
    setDescription,
    status,
    setStatus,
    submitting: saveMutation.isPending,
    error:
      validationError ??
      (saveMutation.error ? getErrorMessage(saveMutation.error, 'Unable to save department.') : null),
    handleSubmit,
  };
}
