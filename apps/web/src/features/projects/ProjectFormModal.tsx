import { useEffect, useState, type FormEvent } from 'react';
import { AlertCircle, FolderPlus, X } from 'lucide-react';
import { getErrorMessage } from '../../lib/errors';
import { validateMinLength } from '../../lib/validation';
import { SURFACE_TOKENS } from '../../theme/tokens';
import type {
  DirectoryPreviewUser,
  ProjectCategory,
  ProjectItem,
  ProjectPriority,
  ProjectStatus,
} from '../../types/auth';
import { listUsers } from '../directory/usersApi';
import { createProject, updateProject } from './projectsApi';

interface ProjectFormModalProps {
  project?: ProjectItem | null;
  onClose: () => void;
  onSaved: (project: ProjectItem) => void;
}

export function ProjectFormModal({ project, onClose, onSaved }: ProjectFormModalProps) {
  const isEditing = Boolean(project);

  const [name, setName] = useState(project?.name ?? '');
  const [description, setDescription] = useState(project?.description ?? '');
  const [category, setCategory] = useState<ProjectCategory>(project?.category ?? 'development');
  const [status, setStatus] = useState<ProjectStatus>(project?.status ?? 'in_progress');
  const [priority, setPriority] = useState<ProjectPriority>(project?.priority ?? 'medium');
  const [tasksTotal, setTasksTotal] = useState(String(project?.tasksTotal ?? 10));
  const [tasksCompleted, setTasksCompleted] = useState(String(project?.tasksCompleted ?? 0));
  const [ownerId, setOwnerId] = useState(project?.owner.id ?? '');
  const [teamMembers, setTeamMembers] = useState<DirectoryPreviewUser[]>([]);
  const [dueDate, setDueDate] = useState(
    project?.dueDate ? project.dueDate.slice(0, 10) : '',
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    listUsers({ status: 'active', signal: controller.signal })
      .then((res) => setTeamMembers(res.users))
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  const parsedTotal = Math.max(1, Number(tasksTotal) || 1);
  const parsedDone =
    status === 'completed'
      ? parsedTotal
      : Math.min(Math.max(0, Number(tasksCompleted) || 0), parsedTotal);
  const previewProgress =
    status === 'completed' ? 100 : Math.round((parsedDone / parsedTotal) * 100);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = name.trim();
    const validationError = validateMinLength(
      trimmed,
      2,
      'Project name must be at least 2 characters.',
    );
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        name: trimmed,
        description: description.trim(),
        category,
        status,
        priority,
        tasksTotal: parsedTotal,
        tasksCompleted: parsedDone,
        ...(ownerId ? { ownerId } : {}),
        dueDate: dueDate || null,
      };

      const saved = project
        ? await updateProject(project.id, payload)
        : await createProject(payload);

      onSaved(saved);
    } catch (err) {
      setError(getErrorMessage(err, 'Unable to save project.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className={SURFACE_TOKENS.modalBackdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby="project-modal-title"
    >
      <div className={`${SURFACE_TOKENS.modalCard} max-w-lg`}>
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-50 text-sky-700 ring-1 ring-sky-100">
              <FolderPlus className="h-4 w-4" />
            </span>
            <div>
              <h2 id="project-modal-title" className="text-base font-bold text-slate-900">
                {isEditing ? 'Edit Project' : 'Create New Project'}
              </h2>
              <p className="text-xs text-slate-400">
                {isEditing ? 'Update progress, tasks, and delivery status.' : 'Add a tracked initiative to the workspace.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error ? (
          <div
            className="mt-4 flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-800"
            role="alert"
          >
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        ) : null}

        <form className="mt-4 space-y-4" onSubmit={(e) => void handleSubmit(e)}>
          <div>
            <label htmlFor="proj-name" className="block text-xs font-semibold text-slate-700">
              Project Name
            </label>
            <input
              id="proj-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Enterprise Billing v2"
              className="mt-1.5 block w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 text-sm text-slate-900 focus:border-sky-300 focus:bg-white focus:ring-2 focus:ring-sky-100 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="proj-desc" className="block text-xs font-semibold text-slate-700">
              Description
            </label>
            <textarea
              id="proj-desc"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short scope or milestone summary..."
              className="mt-1.5 block w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-3.5 py-2 text-sm text-slate-900 focus:border-sky-300 focus:bg-white focus:ring-2 focus:ring-sky-100 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label htmlFor="proj-cat" className="block text-xs font-semibold text-slate-700">
                Track
              </label>
              <select
                id="proj-cat"
                value={category}
                onChange={(e) => setCategory(e.target.value as ProjectCategory)}
                className="mt-1.5 block w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-sm text-slate-900 focus:border-sky-300 focus:bg-white focus:outline-none"
              >
                <option value="development">Development</option>
                <option value="design">Design</option>
                <option value="testing">Testing</option>
                <option value="security">Security</option>
              </select>
            </div>

            <div>
              <label htmlFor="proj-status" className="block text-xs font-semibold text-slate-700">
                Status
              </label>
              <select
                id="proj-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                className="mt-1.5 block w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-sm text-slate-900 focus:border-sky-300 focus:bg-white focus:outline-none"
              >
                <option value="upcoming">Upcoming</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div>
              <label htmlFor="proj-priority" className="block text-xs font-semibold text-slate-700">
                Priority
              </label>
              <select
                id="proj-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as ProjectPriority)}
                className="mt-1.5 block w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-sm text-slate-900 focus:border-sky-300 focus:bg-white focus:outline-none"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label htmlFor="proj-total" className="block text-xs font-semibold text-slate-700">
                Total Tasks
              </label>
              <input
                id="proj-total"
                type="number"
                min={1}
                max={1000}
                value={tasksTotal}
                onChange={(e) => setTasksTotal(e.target.value)}
                className="mt-1.5 block w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-sm text-slate-900 focus:border-sky-300 focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="proj-done" className="block text-xs font-semibold text-slate-700">
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
                className="mt-1.5 block w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-sm text-slate-900 focus:border-sky-300 focus:bg-white focus:outline-none disabled:opacity-60"
              />
            </div>

            <div>
              <label htmlFor="proj-due" className="block text-xs font-semibold text-slate-700">
                Target Date
              </label>
              <input
                id="proj-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="mt-1.5 block w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-sm text-slate-900 focus:border-sky-300 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {teamMembers.length > 0 ? (
            <div>
              <label htmlFor="proj-owner" className="block text-xs font-semibold text-slate-700">
                Project Owner
              </label>
              <select
                id="proj-owner"
                value={ownerId}
                onChange={(e) => setOwnerId(e.target.value)}
                className="mt-1.5 block w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-3 py-2 text-sm text-slate-900 focus:border-sky-300 focus:bg-white focus:outline-none"
              >
                <option value="">Assign to current user</option>
                {teamMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name} ({member.role})
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div className="rounded-2xl bg-slate-50/80 p-3">
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="font-medium text-slate-500">Calculated Completion</span>
              <span className="tabular-nums font-bold text-slate-800">{previewProgress}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200/70">
              <div
                className="h-full rounded-full bg-emerald-300 transition-all"
                style={{ width: `${previewProgress}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="cursor-pointer rounded-full border border-sky-200/90 bg-sky-100/90 px-5 py-2 text-xs font-semibold text-sky-900 transition hover:bg-sky-200/80 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
