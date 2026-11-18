import { useMemo, useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../components/toast/toastContext';
import { useAuth } from '../features/auth/authContext';
import { getErrorMessage } from '../lib/errors';
import { invalidateWorkspaceQueries } from '../lib/queryKeys';
import { validateMinLength } from '../lib/validation';
import { projectsService, type ProjectInput } from '../services/apiService';
import type {
  DirectoryPreviewUser,
  ProjectItem,
  ProjectPriority,
  ProjectStatus,
  Role,
} from '../types/auth';
import {
  useActiveClients,
  useActiveDepartments,
  useActiveEmployees,
} from './useWorkspaceOptions';

const ROLE_LEAD_ORDER: Record<Role, number> = {
  manager: 0,
  admin: 1,
  viewer: 2,
};

export function useProjectForm(
  project: ProjectItem | null | undefined,
  onSaved: (project: ProjectItem) => void,
) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { user: currentUser } = useAuth();
  const isEditing = Boolean(project);

  const [name, setName] = useState(project?.name ?? '');
  const [description, setDescription] = useState(project?.description ?? '');
  const [departmentId, setDepartmentIdState] = useState(project?.department?.id ?? '');
  const [clientId, setClientId] = useState(project?.client?.id ?? '');
  const [status, setStatus] = useState<ProjectStatus>(project?.status ?? 'in_progress');
  const [priority, setPriority] = useState<ProjectPriority>(project?.priority ?? 'medium');
  const [progress, setProgress] = useState(String(project?.progress ?? 0));
  const [ownerId, setOwnerIdState] = useState(project?.owner.id ?? currentUser?.id ?? '');
  const [leadManuallyChanged, setLeadManuallyChanged] = useState(false);
  const [memberIds, setMemberIds] = useState<string[]>(
    project?.members?.map((member) => member.id) ?? [],
  );
  const [dueDate, setDueDate] = useState(project?.dueDate ? project.dueDate.slice(0, 10) : '');
  const [validationError, setValidationError] = useState<string | null>(null);

  const departments = useActiveDepartments(project?.department);
  const clients = useActiveClients(project?.client);
  const activeEmployees = useActiveEmployees();

  const savedOwner = project?.owner;

  const teamMembers = useMemo(() => {
    const byId = new Map<string, DirectoryPreviewUser>();
    for (const member of activeEmployees) {
      byId.set(member.id, member);
    }

    if (savedOwner && !byId.has(savedOwner.id)) {
      byId.set(savedOwner.id, {
        ...savedOwner,
        status: 'active',
        department: null,
      });
    } else if (currentUser && !byId.has(currentUser.id)) {
      byId.set(currentUser.id, {
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        role: currentUser.role,
        status: 'active',
        department: null,
      });
    }

    return [...byId.values()].sort((a, b) => {
      const aMatchesDept = Boolean(departmentId && a.department?.id === departmentId);
      const bMatchesDept = Boolean(departmentId && b.department?.id === departmentId);
      if (aMatchesDept !== bMatchesDept) return aMatchesDept ? -1 : 1;

      const roleDiff = ROLE_LEAD_ORDER[a.role] - ROLE_LEAD_ORDER[b.role];
      if (roleDiff !== 0) return roleDiff;

      return a.name.localeCompare(b.name);
    });
  }, [activeEmployees, currentUser, departmentId, savedOwner]);

  function setDepartmentId(nextDeptId: string) {
    setDepartmentIdState(nextDeptId);
    if (isEditing || leadManuallyChanged || !nextDeptId) return;

    const deptMatch =
      activeEmployees.find((m) => m.department?.id === nextDeptId && m.role === 'manager') ??
      activeEmployees.find((m) => m.department?.id === nextDeptId && m.role === 'admin') ??
      activeEmployees.find((m) => m.department?.id === nextDeptId);

    if (deptMatch) {
      setOwnerIdState(deptMatch.id);
      setMemberIds((prev) => prev.filter((id) => id !== deptMatch.id));
    } else if (currentUser?.id) {
      setOwnerIdState(currentUser.id);
      setMemberIds((prev) => prev.filter((id) => id !== currentUser.id));
    }
  }

  function setOwnerId(nextOwnerId: string) {
    setLeadManuallyChanged(true);
    setOwnerIdState(nextOwnerId);
    if (nextOwnerId) {
      setMemberIds((prev) => prev.filter((id) => id !== nextOwnerId));
    }
  }

  function toggleMember(memberId: string) {
    setMemberIds((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId],
    );
  }

  function clearMembers() {
    setMemberIds([]);
  }

  const saveMutation = useMutation({
    mutationFn: (payload: ProjectInput) =>
      project ? projectsService.update(project.id, payload) : projectsService.create(payload),
    onSuccess: (saved) => {
      void invalidateWorkspaceQueries(queryClient, [
        'projects',
        'dashboard',
        'departments',
        'clients',
        'users',
        'audit',
      ]);
      toast.success(
        isEditing ? `Updated "${saved.name}".` : `Created project "${saved.name}".`,
      );
      onSaved(saved);
    },
    onError: (err: unknown) => {
      toast.error(getErrorMessage(err, 'Unable to save project.'));
    },
  });

  const parsedProgress =
    status === 'completed'
      ? 100
      : Math.max(0, Math.min(100, Math.round(Number(progress) || 0)));

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
        departmentId: departmentId || null,
        clientId: clientId || null,
        status,
        priority,
        progress: parsedProgress,
        ...(ownerId ? { ownerId } : {}),
        memberIds,
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
    departmentId,
    setDepartmentId,
    clientId,
    setClientId,
    status,
    setStatus,
    priority,
    setPriority,
    progress,
    setProgress,
    ownerId,
    setOwnerId,
    memberIds,
    toggleMember,
    clearMembers,
    dueDate,
    setDueDate,
    departments,
    clients,
    teamMembers,
    submitting: saveMutation.isPending,
    error:
      validationError ??
      (saveMutation.error ? getErrorMessage(saveMutation.error, 'Unable to save project.') : null),
    handleSubmit,
  };
}
