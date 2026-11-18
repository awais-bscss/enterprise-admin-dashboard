import { AlertCircle, FolderPlus, X } from 'lucide-react';
import {
  AppDropdown,
  AppMultiSelectDropdown,
  type DropdownOption,
} from '../../components/AppDropdown';
import { useModalScrollLock } from '../../hooks/useModalScrollLock';
import { useProjectForm } from '../../hooks/useProjectForm';
import { BUTTON_TOKENS, SURFACE_TOKENS } from '../../theme/tokens';
import type {
  DirectoryPreviewUser,
  ProjectItem,
  ProjectPriority,
  ProjectStatus,
} from '../../types/auth';
import { useAuth } from '../auth/authContext';

const STATUS_OPTIONS: readonly DropdownOption<ProjectStatus>[] = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
];

const PRIORITY_OPTIONS: readonly DropdownOption<ProjectPriority>[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

interface ProjectFormModalProps {
  project?: ProjectItem | null;
  onClose: () => void;
  onSaved: (project: ProjectItem) => void;
}

export function ProjectFormModal({ project, onClose, onSaved }: ProjectFormModalProps) {
  useModalScrollLock(true);
  const { user: currentUser } = useAuth();
  const {
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
    submitting,
    error,
    handleSubmit,
  } = useProjectForm(project, onSaved);

  const effectiveLeadId = ownerId || currentUser?.id || '';
  const toOption = (member: DirectoryPreviewUser): DropdownOption => ({
    value: member.id,
    label: member.name,
    subtitle: `${member.department?.name ?? 'General'} · ${member.role}`,
    badge:
      departmentId && member.department?.id === departmentId
        ? 'Dept'
        : currentUser?.id === member.id
          ? 'You'
          : undefined,
  });
  const leadOptions = teamMembers.map(toOption);
  const collaboratorMembers = teamMembers.filter((member) => member.id !== effectiveLeadId);
  const collaboratorOptions = collaboratorMembers.map(toOption);
  const selectedCollaborators = collaboratorMembers.filter((member) =>
    memberIds.includes(member.id),
  );
  const totalWorkingCount = 1 + selectedCollaborators.length;

  return (
    <div
      className={SURFACE_TOKENS.modalBackdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby="project-modal-title"
    >
      <div className={`${SURFACE_TOKENS.modalCard} max-w-lg`}>
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-50 text-sky-700 ring-1 ring-sky-100 dark:bg-sky-500/15 dark:text-sky-300 dark:ring-sky-500/30">
              <FolderPlus className="h-4 w-4" />
            </span>
            <div>
              <h2
                id="project-modal-title"
                className="text-base font-bold text-slate-900 dark:text-slate-100"
              >
                {isEditing ? 'Edit Project' : 'Create New Project'}
              </h2>
              <p className="text-xs text-slate-400">
                {isEditing
                  ? 'Update progress, department, client, and assigned employee.'
                  : 'Create a project linked to a department, client, and employee.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
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

        <form className="mt-4 space-y-4" onSubmit={(e) => void handleSubmit(e)}>
          <div>
            <label
              htmlFor="proj-name"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Project Name
            </label>
            <input
              id="proj-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Enterprise Billing v2"
              className={`mt-1.5 ${SURFACE_TOKENS.input}`}
            />
          </div>

          <div>
            <label
              htmlFor="proj-desc"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Description
            </label>
            <textarea
              id="proj-desc"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short scope or milestone summary..."
              className={`mt-1.5 py-2 ${SURFACE_TOKENS.input}`}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label
                htmlFor="proj-dept"
                className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Department
              </label>
              <AppDropdown
                id="proj-dept"
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
                htmlFor="proj-client"
                className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Client
              </label>
              <AppDropdown
                id="proj-client"
                variant="field"
                searchable
                searchPlaceholder="Search clients..."
                value={clientId}
                options={[
                  { value: '', label: 'Internal / None' },
                  ...clients.map((client) => ({
                    value: client.id,
                    label: `${client.company} (${client.name})`,
                  })),
                ]}
                onChange={setClientId}
                ariaLabel="Client"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label
                htmlFor="proj-status"
                className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Status
              </label>
              <AppDropdown<ProjectStatus>
                id="proj-status"
                variant="field"
                value={status}
                options={STATUS_OPTIONS}
                onChange={setStatus}
                ariaLabel="Status"
              />
            </div>

            <div>
              <label
                htmlFor="proj-priority"
                className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Priority
              </label>
              <AppDropdown<ProjectPriority>
                id="proj-priority"
                variant="field"
                value={priority}
                options={PRIORITY_OPTIONS}
                onChange={setPriority}
                ariaLabel="Priority"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label
                htmlFor="proj-progress"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Progress (%)
              </label>
              <input
                id="proj-progress"
                type="number"
                min={0}
                max={100}
                value={status === 'completed' ? '100' : progress}
                onChange={(e) => setProgress(e.target.value)}
                disabled={status === 'completed'}
                className={`mt-1.5 py-2 ${SURFACE_TOKENS.input} disabled:opacity-60`}
              />
            </div>

            <div>
              <label
                htmlFor="proj-due"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Target Date
              </label>
              <input
                id="proj-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={`mt-1.5 py-2 ${SURFACE_TOKENS.input}`}
              />
            </div>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <label
                htmlFor="proj-owner"
                className="text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Project Lead
              </label>
              {departmentId ? (
                <span className="text-[11px] text-slate-400">
                  Department leads prioritized first
                </span>
              ) : null}
            </div>
            <AppDropdown
              id="proj-owner"
              variant="field"
              searchable
              searchPlaceholder="Search lead by name or department..."
              value={effectiveLeadId}
              options={
                leadOptions.length > 0
                  ? leadOptions
                  : [{ value: '', label: 'Loading active employees...' }]
              }
              onChange={setOwnerId}
              ariaLabel="Project Lead"
            />
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <label
                htmlFor="proj-team"
                className="text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Working Team
              </label>
              <span className="tabular-nums rounded-full bg-sky-50 px-2.5 py-0.5 text-[11px] font-semibold text-sky-700 dark:bg-sky-500/15 dark:text-sky-300">
                {totalWorkingCount} {totalWorkingCount === 1 ? 'employee' : 'employees'} working
              </span>
            </div>

            <AppMultiSelectDropdown
              id="proj-team"
              searchable
              searchPlaceholder="Search employees by name or department..."
              placeholder="Select additional team members..."
              emptyMessage="No additional active employees available."
              values={memberIds}
              options={collaboratorOptions}
              onToggle={toggleMember}
              onClear={clearMembers}
              ariaLabel="Working Team"
            />

            {selectedCollaborators.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {selectedCollaborators.map((member) => (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => toggleMember(member.id)}
                    aria-label={`Remove ${member.name} from working team`}
                    className="inline-flex cursor-pointer items-center gap-1 rounded-full bg-primary-soft px-2.5 py-0.5 text-[11px] font-medium text-primary-ink ring-1 ring-primary-border transition hover:opacity-85"
                  >
                    <span>{member.name}</span>
                    <X className="h-3 w-3 shrink-0" aria-hidden="true" />
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 pt-4 dark:border-slate-800">
            <button type="button" onClick={onClose} className={BUTTON_TOKENS.secondaryPill}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`${BUTTON_TOKENS.primarySoftPill} px-5`}
            >
              {submitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
