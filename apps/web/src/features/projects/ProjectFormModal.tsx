import { AlertCircle, FolderPlus, X } from 'lucide-react';
import { AppDropdown, type DropdownOption } from '../../components/AppDropdown';
import { BUTTON_TOKENS, SURFACE_TOKENS } from '../../theme/tokens';
import type {
  ProjectCategory,
  ProjectItem,
  ProjectPriority,
  ProjectStatus,
} from '../../types/auth';
import { useModalScrollLock } from '../../hooks/useModalScrollLock';
import { useProjectForm } from '../../hooks/useProjectForm';

const CATEGORY_OPTIONS: readonly DropdownOption<ProjectCategory>[] = [
  { value: 'development', label: 'Development' },
  { value: 'design', label: 'Design' },
  { value: 'testing', label: 'Testing' },
  { value: 'security', label: 'Security' },
];

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
  const {
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
    teamMembers,
    parsedTotal,
    submitting,
    error,
    handleSubmit,
  } = useProjectForm(project, onSaved);

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
                  ? 'Update progress, tasks, and delivery status.'
                  : 'Add a tracked initiative to the workspace.'}
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

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label
                htmlFor="proj-cat"
                className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Track
              </label>
              <AppDropdown<ProjectCategory>
                id="proj-cat"
                variant="field"
                value={category}
                options={CATEGORY_OPTIONS}
                onChange={setCategory}
                ariaLabel="Track"
              />
            </div>

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

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label
                htmlFor="proj-total"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Total Tasks
              </label>
              <input
                id="proj-total"
                type="number"
                min={1}
                max={1000}
                value={tasksTotal}
                onChange={(e) => setTasksTotal(e.target.value)}
                className={`mt-1.5 py-2 ${SURFACE_TOKENS.input}`}
              />
            </div>

            <div>
              <label
                htmlFor="proj-done"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Completed Tasks
              </label>
              <input
                id="proj-done"
                type="number"
                min={0}
                max={parsedTotal}
                value={status === 'completed' ? String(parsedTotal) : tasksCompleted}
                onChange={(e) => setTasksCompleted(e.target.value)}
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

          {teamMembers.length > 0 ? (
            <div>
              <label
                htmlFor="proj-owner"
                className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Project Owner
              </label>
              <AppDropdown
                id="proj-owner"
                variant="field"
                value={ownerId}
                options={[
                  { value: '', label: 'Assign to current user' },
                  ...teamMembers.map((member) => ({
                    value: member.id,
                    label: `${member.name} (${member.role})`,
                  })),
                ]}
                onChange={setOwnerId}
                ariaLabel="Project Owner"
              />
            </div>
          ) : null}

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
