import { Pencil, Trash2 } from 'lucide-react';
import { AppDropdown, type DropdownOption } from '../../components/AppDropdown';
import { LinkedCountPill } from '../../components/LinkedCountPill';
import { getInitials } from '../../lib/formatters';
import { BADGE_TOKENS } from '../../theme/tokens';
import type { DirectoryPreviewUser, Role } from '../../types/auth';
import { PermissionGate } from '../auth/PermissionGate';

const USER_ROLE_OPTIONS: readonly DropdownOption<Role>[] = [
  { value: 'admin', label: 'Admin' },
  { value: 'manager', label: 'Manager' },
  { value: 'viewer', label: 'Viewer' },
];

interface EmployeeTableRowProps {
  member: DirectoryPreviewUser;
  isSelf: boolean;
  isBusy: boolean;
  departmentFilter: string;
  onToggleDepartment: (id: string) => void;
  onRoleChange: (member: DirectoryPreviewUser, role: Role) => void;
  onStatusToggle: (member: DirectoryPreviewUser) => void;
  onEdit: (member: DirectoryPreviewUser) => void;
  onDelete: (member: DirectoryPreviewUser) => void;
}

export function EmployeeTableRow({
  member,
  isSelf,
  isBusy,
  departmentFilter,
  onToggleDepartment,
  onRoleChange,
  onStatusToggle,
  onEdit,
  onDelete,
}: EmployeeTableRowProps) {
  return (
    <tr className="hover:bg-surface-subtle/60">
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-50 text-xs font-bold text-sky-800 ring-1 ring-sky-100 dark:bg-sky-500/15 dark:text-sky-300 dark:ring-sky-500/30">
            {getInitials(member.name)}
          </span>
          <span className="font-semibold text-slate-900 dark:text-slate-100">
            {member.name}
            {isSelf ? (
              <span className="ml-1.5 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                You
              </span>
            ) : null}
          </span>
        </div>
      </td>

      <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400">{member.email}</td>

      <td className="px-5 py-3.5">
        {member.department ? (
          <button
            type="button"
            onClick={() =>
              onToggleDepartment(
                departmentFilter === member.department!.id ? '' : member.department!.id,
              )
            }
            title={`Filter by ${member.department.name}`}
            className={`cursor-pointer rounded-full px-2.5 py-0.5 text-[11px] font-semibold whitespace-nowrap ring-1 transition ${
              departmentFilter === member.department.id
                ? 'bg-violet-100 text-violet-800 ring-violet-300 dark:bg-violet-500/25 dark:text-violet-200 dark:ring-violet-400/50'
                : 'bg-violet-50 text-violet-700 ring-violet-200/70 hover:bg-violet-100 dark:bg-violet-500/15 dark:text-violet-300 dark:ring-violet-500/30 dark:hover:bg-violet-500/25'
            }`}
          >
            {member.department.name}
          </button>
        ) : (
          <span className="text-xs text-slate-400">Unassigned</span>
        )}
      </td>

      <td className="px-5 py-3.5">
        <PermissionGate
          permission="users:write"
          fallback={
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${BADGE_TOKENS.role[member.role]}`}
            >
              {member.role}
            </span>
          }
        >
          <AppDropdown<Role>
            compact
            value={member.role}
            options={USER_ROLE_OPTIONS}
            disabled={isSelf || isBusy}
            onChange={(nextRole) => onRoleChange(member, nextRole)}
            ariaLabel={`Change role for ${member.name}`}
          />
        </PermissionGate>
      </td>

      <td className="px-5 py-3.5">
        <LinkedCountPill
          count={member.projectCount ?? 0}
          singular="project"
          plural="projects"
          to={`/projects?ownerId=${member.id}`}
          title={`View projects assigned to ${member.name}`}
        />
      </td>

      <td className="px-5 py-3.5">
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${BADGE_TOKENS.accountStatus[member.status]}`}
        >
          {member.status}
        </span>
      </td>

      <PermissionGate permission="users:write">
        <td className="px-5 py-3.5">
          <div className="flex items-center justify-end gap-1.5">
            <button
              type="button"
              disabled={isSelf || isBusy}
              onClick={() => onStatusToggle(member)}
              className="cursor-pointer rounded-full border border-slate-200 bg-surface px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {member.status === 'active' ? 'Suspend' : 'Activate'}
            </button>

            <button
              type="button"
              disabled={isBusy}
              aria-label={`Edit ${member.name}`}
              onClick={() => onEdit(member)}
              className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-surface text-slate-500 transition hover:bg-sky-50 hover:text-sky-700 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-sky-500/20 dark:hover:text-sky-300"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              disabled={isSelf || isBusy}
              aria-label={`Delete ${member.name}`}
              onClick={() => onDelete(member)}
              className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-surface text-slate-500 transition hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-45 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-rose-500/20 dark:hover:text-rose-300"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </td>
      </PermissionGate>
    </tr>
  );
}

