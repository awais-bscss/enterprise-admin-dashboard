import { Pencil, Trash2 } from 'lucide-react';
import {
  formatDeadlineCountdown,
  formatRelativeUpdated,
  getDeadlineUrgency,
  getInitials,
  getUtcDaysRemaining,
} from '../../lib/formatters';
import { BADGE_TOKENS } from '../../theme/tokens';
import type { ProjectItem } from '../../types/auth';

interface ProjectTableRowProps {
  project: ProjectItem;
  canWrite: boolean;
  isBusy: boolean;
  departmentFilter: string;
  clientFilter: string;
  ownerFilter: string;
  onToggleDepartment: (id: string) => void;
  onToggleClient: (id: string) => void;
  onToggleOwner: (id: string) => void;
  onEdit: (project: ProjectItem) => void;
  onDelete: (project: ProjectItem) => void;
}

export function ProjectTableRow({
  project,
  canWrite,
  isBusy,
  departmentFilter,
  clientFilter,
  ownerFilter,
  onToggleDepartment,
  onToggleClient,
  onToggleOwner,
  onEdit,
  onDelete,
}: ProjectTableRowProps) {
  const statusMeta = BADGE_TOKENS.projectStatus[project.status];
  const updatedMeta = formatRelativeUpdated(project.updatedAt);
  const dueDays =
    project.dueDate && project.status !== 'completed'
      ? getUtcDaysRemaining(project.dueDate)
      : null;
  const dueUrgency = dueDays !== null ? getDeadlineUrgency(dueDays) : null;
  const team = [project.owner, ...(project.members ?? [])];
  const teamTooltip = `Lead: ${project.owner.name}${
    (project.members ?? []).length > 0
      ? ` · Team: ${project.members!.map((m) => m.name).join(', ')}`
      : ''
  }`;

  return (
    <tr className="hover:bg-surface-subtle/60">
      <td className="max-w-xs px-5 py-3.5">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-slate-900 dark:text-slate-100">{project.name}</p>
          {updatedMeta.isRecent ? (
            <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
              Recent
            </span>
          ) : null}
        </div>
        <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
          {project.description || 'No description provided.'}
        </p>
        <p className="mt-0.5 text-[10px] font-medium text-slate-400">{updatedMeta.label}</p>
      </td>

      <td className="px-5 py-3.5">
        {project.department ? (
          <button
            type="button"
            onClick={() =>
              onToggleDepartment(
                departmentFilter === project.department!.id ? '' : project.department!.id,
              )
            }
            title={`Filter by ${project.department.name}`}
            className={`cursor-pointer rounded-full px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap ring-1 transition ${
              departmentFilter === project.department.id
                ? 'bg-violet-100 text-violet-800 ring-violet-300 dark:bg-violet-500/25 dark:text-violet-200 dark:ring-violet-400/50'
                : 'bg-violet-50 text-violet-700 ring-violet-200/70 hover:bg-violet-100 dark:bg-violet-500/15 dark:text-violet-300 dark:ring-violet-500/30 dark:hover:bg-violet-500/25'
            }`}
          >
            {project.department.name}
          </button>
        ) : (
          <span className="text-xs text-slate-400">Unassigned</span>
        )}
      </td>

      <td className="px-5 py-3.5 text-xs whitespace-nowrap">
        {project.client ? (
          <button
            type="button"
            onClick={() =>
              onToggleClient(clientFilter === project.client!.id ? '' : project.client!.id)
            }
            title={`Filter by client ${project.client.company}`}
            className={`cursor-pointer rounded-full px-2 py-0.5 font-medium transition ${
              clientFilter === project.client.id
                ? 'bg-cyan-50 text-cyan-800 ring-1 ring-cyan-200 dark:bg-cyan-500/20 dark:text-cyan-200 dark:ring-cyan-500/40'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
          >
            {project.client.company}
          </button>
        ) : (
          <span className="text-slate-400">--</span>
        )}
      </td>

      <td className="px-5 py-3.5">
        <span
          className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap ${statusMeta.className}`}
        >
          {statusMeta.label}
        </span>
      </td>

      <td className="min-w-[140px] px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200/70 dark:bg-slate-700">
            <div
              className={`h-full rounded-full ${
                project.status === 'completed'
                  ? 'bg-emerald-300 dark:bg-emerald-400/80'
                  : 'bg-sky-300 dark:bg-sky-400/80'
              }`}
              style={{ width: `${project.progress}%` }}
            />
          </div>
          <span className="tabular-nums w-9 text-right text-xs font-bold text-slate-700 dark:text-slate-200">
            {project.progress}%
          </span>
        </div>
      </td>

      <td className="px-5 py-3.5 text-xs font-medium text-slate-600 capitalize dark:text-slate-300">
        {project.priority}
      </td>

      <td className="px-5 py-3.5">
        <button
          type="button"
          onClick={() => onToggleOwner(ownerFilter === project.owner.id ? '' : project.owner.id)}
          title={teamTooltip}
          className={`flex cursor-pointer items-center gap-2 rounded-full py-0.5 pr-2.5 text-left transition ${
            ownerFilter === project.owner.id
              ? 'bg-sky-50 ring-1 ring-sky-200 dark:bg-sky-500/15 dark:ring-sky-500/30'
              : 'hover:bg-slate-100/80 dark:hover:bg-slate-800'
          }`}
        >
          <div className="flex items-center -space-x-2">
            {team.slice(0, 3).map((member, idx) => (
              <span
                key={member.id}
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ring-2 ring-white dark:ring-slate-900 ${
                  BADGE_TOKENS.avatarTones[idx % BADGE_TOKENS.avatarTones.length]
                }`}
              >
                {getInitials(member.name)}
              </span>
            ))}
            {team.length > 3 ? (
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-600 ring-2 ring-white dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-900">
                +{team.length - 3}
              </span>
            ) : null}
          </div>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-xs font-medium text-slate-700 dark:text-slate-200">
              {project.owner.name}
            </p>
            <p className="tabular-nums text-[10px] font-semibold text-slate-400">
              {team.length} {team.length === 1 ? 'employee' : 'employees'}
            </p>
          </div>
        </button>
      </td>

      <td className="tabular-nums px-5 py-3.5 text-xs whitespace-nowrap">
        {project.dueDate ? (
          <div className="space-y-1">
            <span className="block text-slate-500 dark:text-slate-400">
              {new Date(project.dueDate).toLocaleDateString()}
            </span>
            {dueUrgency && dueDays !== null ? (
              <span
                className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${BADGE_TOKENS.deadlineUrgency[dueUrgency].badge}`}
              >
                {formatDeadlineCountdown(dueDays)}
              </span>
            ) : null}
          </div>
        ) : (
          <span className="text-slate-400">--</span>
        )}
      </td>

      {canWrite ? (
        <td className="px-5 py-3.5">
          <div className="flex items-center justify-end gap-1.5">
            <button
              type="button"
              disabled={isBusy}
              aria-label={`Edit ${project.name}`}
              onClick={() => onEdit(project)}
              className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-surface text-slate-500 transition hover:bg-sky-50 hover:text-sky-700 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-sky-500/20 dark:hover:text-sky-300"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              disabled={isBusy}
              aria-label={`Delete ${project.name}`}
              onClick={() => onDelete(project)}
              className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-surface text-slate-500 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-rose-500/20 dark:hover:text-rose-300"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </td>
      ) : null}
    </tr>
  );
}

