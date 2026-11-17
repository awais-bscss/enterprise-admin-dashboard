import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../components/toast/toastContext';
import { getErrorMessage } from '../lib/errors';
import { invalidateWorkspaceQueries, queryKeys } from '../lib/queryKeys';
import { validateMinLength } from '../lib/validation';
import { projectsService, usersService, type ProjectInput } from '../services/apiService';
import type {
  ProjectCategory,
  ProjectItem,
  ProjectPriority,
  ProjectStatus,
} from '../types/auth';

export function useProjectForm(
  project: ProjectItem | null | undefined,
  onSaved: (project: ProjectItem) => void,
) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const isEditing = Boolean(project);

  const [name, setName] = useState(project?.name ?? '');
  const [description, setDescription] = useState(project?.description ?? '');
  const [category, setCategory] = useState<ProjectCategory>(project?.category ?? 'development');
  const [status, setStatus] = useState<ProjectStatus>(project?.status ?? 'in_progress');
  const [priority, setPriority] = useState<ProjectPriority>(project?.priority ?? 'medium');
  const [tasksTotal, setTasksTotal] = useState(String(project?.tasksTotal ?? 10));
  const [tasksCompleted, setTasksCompleted] = useState(String(project?.tasksCompleted ?? 0));
  const [ownerId, setOwnerId] = useState(project?.owner.id ?? '');
  const [dueDate, setDueDate] = useState(project?.dueDate ? project.dueDate.slice(0, 10) : '');
  const [validationError, setValidationError] = useState<string | null>(null);

  const membersQuery = useQuery({
    queryKey: queryKeys.users.list({ q: '', role: '', status: 'active', page: 1, limit: 50 }),
    queryFn: ({ signal }) => usersService.list({ status: 'active', limit: 50, signal }),
  });

  const saveMutation = useMutation({
    mutationFn: (payload: ProjectInput) =>
      project ? projectsService.update(project.id, payload) : projectsService.create(payload),
    onSuccess: async (saved) => {
      await invalidateWorkspaceQueries(queryClient, ['projects', 'dashboard', 'users', 'audit']);
      toast.success(
        isEditing ? `Updated "${saved.name}".` : `Created project "${saved.name}".`,
      );
      onSaved(saved);
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, 'Unable to save project.'));
    },
  });

  const parsedTotal = Math.max(1, Number(tasksTotal) || 1);
  const parsedDone =
    status === 'completed'
      ? parsedTotal
      : Math.min(Math.max(0, Number(tasksCompleted) || 0), parsedTotal);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = name.trim();
    const nextValidationError = validateMinLength(
      trimmed,
      2,
      'Project name must be at least 2 characters.',
    );
    if (nextValidationError) {
      setValidationError(nextValidationError);
      return;
    }

    setValidationError(null);
    await saveMutation
      .mutateAsync({
        name: trimmed,
        description: description.trim(),
        category,
        status,
        priority,
        tasksTotal: parsedTotal,
        tasksCompleted: parsedDone,
        ...(ownerId ? { ownerId } : {}),
        dueDate: dueDate || null,
      })
      .catch(() => undefined);
  }

  return {
    isEditing,
    name,
    setName,
    description,
    setDescription,
    category,
    setCategory,
    status,
    setStatus,
    priority,
    setPriority,
    tasksTotal,
    setTasksTotal,
    tasksCompleted,
    setTasksCompleted,
    ownerId,
    setOwnerId,
    dueDate,
    setDueDate,
    teamMembers: membersQuery.data?.users ?? [],
    parsedTotal,
    submitting: saveMutation.isPending,
    error:
      validationError ??
      (saveMutation.error ? getErrorMessage(saveMutation.error, 'Unable to save project.') : null),
    handleSubmit,
  };
}
