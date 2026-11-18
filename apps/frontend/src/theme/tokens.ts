import type { AuditLogItem, DeadlineUrgency, ProjectStatus, Role } from '../types/auth';

export const SURFACE_TOKENS = {
  canvas: 'bg-canvas text-slate-900 dark:text-slate-100',
  card: 'bento-card',
  cardInteractive:
    'bento-card transition hover:border-slate-300/80 dark:hover:border-slate-600/80',
  panel:
    'bento-shadow rounded-panel border border-slate-200/70 bg-surface dark:border-slate-700/70',
  modalBackdrop:
    'fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/25 p-4 backdrop-blur-[2px] dark:bg-slate-950/70',
  modalCard: 'bento-modal my-auto max-h-[90vh] w-full overflow-y-auto p-6',
  input:
    'block w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-300 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-sky-500 dark:focus:bg-slate-800',
} as const;

export const BUTTON_TOKENS = {
  primarySolid:
    'inline-flex cursor-pointer items-center justify-center rounded-md bg-primary text-xs font-semibold tracking-wider text-white uppercase shadow-[0_4px_12px_rgba(3,105,161,0.22)] transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60',
  primarySoftPill:
    'inline-flex cursor-pointer items-center gap-2 rounded-full border border-primary-border bg-primary-soft px-4 py-2 text-xs font-semibold text-primary-ink transition hover:bg-primary-soft-hover disabled:cursor-not-allowed disabled:opacity-60',
  secondaryPill:
    'inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-200/80 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800/90 dark:text-slate-200 dark:hover:bg-slate-800',
  iconCircle:
    'inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-slate-200/80 bg-white text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800/90 dark:text-slate-300 dark:hover:bg-slate-800',
  filterActive:
    'cursor-pointer rounded-full bg-primary-soft px-3.5 py-1.5 text-xs font-semibold text-primary-ink ring-1 ring-primary-border transition',
  filterIdle:
    'cursor-pointer rounded-full bg-slate-50 px-3.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-800',
  alertError:
    'rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-500/40 dark:bg-rose-950/50 dark:text-rose-200',
} as const;

export const BADGE_TOKENS = {
  role: {
    admin:
      'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/80 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/30',
    manager:
      'bg-sky-50 text-sky-700 ring-1 ring-sky-200/80 dark:bg-sky-500/15 dark:text-sky-300 dark:ring-sky-500/30',
    viewer:
      'bg-rose-50 text-rose-700 ring-1 ring-rose-200/80 dark:bg-rose-500/15 dark:text-rose-300 dark:ring-rose-500/30',
  } satisfies Record<Role, string>,
  accountStatus: {
    active: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
    suspended: 'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
  } satisfies Record<'active' | 'suspended', string>,
  entityStatus: {
    active: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
    inactive: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  } satisfies Record<'active' | 'inactive', string>,
  projectStatus: {
    completed: {
      label: 'Completed',
      className:
        'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/70 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-500/30',
    },
    in_progress: {
      label: 'In Progress',
      className:
        'bg-rose-50 text-rose-700 ring-1 ring-rose-200/70 dark:bg-rose-500/15 dark:text-rose-300 dark:ring-rose-500/30',
    },
    upcoming: {
      label: 'Upcoming',
      className:
        'bg-sky-50 text-sky-700 ring-1 ring-sky-200/70 dark:bg-sky-500/15 dark:text-sky-300 dark:ring-sky-500/30',
    },
  } satisfies Record<ProjectStatus, { label: string; className: string }>,
  auditResource: {
    auth: 'bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
    project: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
    department: 'bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
    client: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300',
    user: 'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
    report: 'bg-amber-50 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
  } satisfies Record<AuditLogItem['resourceType'], string>,
  deadlineUrgency: {
    critical: {
      card: 'border-rose-200/80 bg-rose-50/70 hover:border-rose-300 dark:border-rose-500/30 dark:bg-rose-950/25 dark:hover:border-rose-500/50',
      badge: 'bg-rose-100 text-rose-700 ring-1 ring-rose-200/80 dark:bg-rose-500/20 dark:text-rose-200 dark:ring-rose-500/30',
      icon: 'text-rose-600 dark:text-rose-400',
    },
    warning: {
      card: 'border-amber-200/80 bg-amber-50/70 hover:border-amber-300 dark:border-amber-500/30 dark:bg-amber-950/25 dark:hover:border-amber-500/50',
      badge: 'bg-amber-100 text-amber-800 ring-1 ring-amber-200/80 dark:bg-amber-500/20 dark:text-amber-200 dark:ring-amber-500/30',
      icon: 'text-amber-600 dark:text-amber-400',
    },
    upcoming: {
      card: 'border-sky-200/80 bg-sky-50/60 hover:border-sky-300 dark:border-sky-500/30 dark:bg-sky-950/20 dark:hover:border-sky-500/50',
      badge: 'bg-sky-100 text-sky-700 ring-1 ring-sky-200/80 dark:bg-sky-500/20 dark:text-sky-200 dark:ring-sky-500/30',
      icon: 'text-sky-600 dark:text-sky-400',
    },
  } satisfies Record<DeadlineUrgency, { card: string; badge: string; icon: string }>,
  avatarTones: [
    'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200',
    'bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-200',
    'bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-200',
    'bg-violet-100 text-violet-800 dark:bg-violet-500/20 dark:text-violet-200',
  ] as const,
} as const;

export type BentoTone = 'mint' | 'sky' | 'violet' | 'rose';

export const BENTO_TONE_TOKENS: Record<
  BentoTone,
  { ring: string; iconBg: string; iconText: string; badgeBg: string; badgeText: string }
> = {
  mint: {
    ring: 'ring-emerald-100 dark:ring-emerald-500/20',
    iconBg: 'bg-emerald-100/80 dark:bg-emerald-500/15',
    iconText: 'text-emerald-700 dark:text-emerald-300',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-500/15',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
  },
  sky: {
    ring: 'ring-sky-100 dark:ring-sky-500/20',
    iconBg: 'bg-sky-100/80 dark:bg-sky-500/15',
    iconText: 'text-sky-700 dark:text-sky-300',
    badgeBg: 'bg-sky-50 dark:bg-sky-500/15',
    badgeText: 'text-sky-700 dark:text-sky-300',
  },
  violet: {
    ring: 'ring-violet-100 dark:ring-violet-500/20',
    iconBg: 'bg-violet-100/80 dark:bg-violet-500/15',
    iconText: 'text-violet-700 dark:text-violet-300',
    badgeBg: 'bg-violet-50 dark:bg-violet-500/15',
    badgeText: 'text-violet-700 dark:text-violet-300',
  },
  rose: {
    ring: 'ring-rose-100 dark:ring-rose-500/20',
    iconBg: 'bg-rose-100/80 dark:bg-rose-500/15',
    iconText: 'text-rose-700 dark:text-rose-300',
    badgeBg: 'bg-rose-50 dark:bg-rose-500/15',
    badgeText: 'text-rose-700 dark:text-rose-300',
  },
};

export interface DepartmentChartTone {
  hatchBase: string;
  hatchLine: string;
  border: string;
  pillClass: string;
}

export const DEPARTMENT_PASTEL_TONES: readonly DepartmentChartTone[] = [
  {
    hatchBase: '#EFF6FF',
    hatchLine: '#93C5FD',
    border: '#BFDBFE',
    pillClass: 'bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
  },
  {
    hatchBase: '#FDF2F8',
    hatchLine: '#F9A8D4',
    border: '#FBCFE8',
    pillClass: 'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
  },
  {
    hatchBase: '#ECFDF5',
    hatchLine: '#6EE7B7',
    border: '#A7F3D0',
    pillClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  },
  {
    hatchBase: '#F5F3FF',
    hatchLine: '#C4B5FD',
    border: '#DDD6FE',
    pillClass: 'bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
  },
  {
    hatchBase: '#FFFBEB',
    hatchLine: '#FCD34D',
    border: '#FDE68A',
    pillClass: 'bg-amber-50 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
  },
  {
    hatchBase: '#ECFEFF',
    hatchLine: '#67E8F9',
    border: '#A5F3FC',
    pillClass: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-500/15 dark:text-cyan-300',
  },
  {
    hatchBase: '#EEF2FF',
    hatchLine: '#A5B4FC',
    border: '#C7D2FE',
    pillClass: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300',
  },
  {
    hatchBase: '#F0FDFA',
    hatchLine: '#5EEAD4',
    border: '#99F6E4',
    pillClass: 'bg-teal-50 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300',
  },
];

export const DEPARTMENT_DARK_HATCHES = [
  { hatchBase: 'rgba(125, 211, 252, 0.16)', hatchLine: '#7DD3FC', border: '#7DD3FC' },
  { hatchBase: 'rgba(249, 168, 212, 0.16)', hatchLine: '#F9A8D4', border: '#F9A8D4' },
  { hatchBase: 'rgba(110, 231, 183, 0.16)', hatchLine: '#6EE7B7', border: '#6EE7B7' },
  { hatchBase: 'rgba(196, 181, 253, 0.16)', hatchLine: '#C4B5FD', border: '#C4B5FD' },
  { hatchBase: 'rgba(252, 211, 77, 0.16)', hatchLine: '#FCD34D', border: '#FCD34D' },
  { hatchBase: 'rgba(103, 232, 249, 0.16)', hatchLine: '#67E8F9', border: '#67E8F9' },
  { hatchBase: 'rgba(165, 180, 252, 0.16)', hatchLine: '#A5B4FC', border: '#A5B4FC' },
  { hatchBase: 'rgba(94, 234, 212, 0.16)', hatchLine: '#5EEAD4', border: '#5EEAD4' },
] as const;

export const CHART_SERIES_TOKENS = {
  rose: {
    hatchBase: '#FDF2F8',
    hatchLine: '#F9A8D4',
    border: '#FBCFE8',
    stroke: '#F472B6',
    dot: '#F9A8D4',
    fillStop: '#FBCFE8',
    barClass: 'bg-rose-300 dark:bg-rose-400/80',
  },
  sky: {
    hatchBase: '#EFF6FF',
    hatchLine: '#93C5FD',
    border: '#BFDBFE',
    stroke: '#60A5FA',
    dot: '#93C5FD',
    fillStop: '#BAE6FD',
    barClass: 'bg-sky-300 dark:bg-sky-400/80',
  },
  mint: {
    hatchBase: '#ECFDF5',
    hatchLine: '#6EE7B7',
    border: '#A7F3D0',
    fill: '#A7F3D0',
    barClass: 'bg-emerald-300 dark:bg-emerald-400/80',
  },
  violet: {
    hatchBase: '#F5F3FF',
    hatchLine: '#C4B5FD',
    border: '#DDD6FE',
  },
} as const;

export function getChartPalette(isDark: boolean) {
  return {
    axisTick: {
      fill: isDark ? '#94A3B8' : '#64748B',
      fontSize: 11,
      fontWeight: 500,
    },
    labelFill: isDark ? '#CBD5E1' : '#475569',
    gridStroke: isDark ? 'rgba(51, 65, 85, 0.55)' : '#F1F5F9',
    tooltipCursor: isDark ? 'rgba(30, 41, 59, 0.45)' : 'rgba(226, 232, 240, 0.45)',
    emptySlice: isDark ? '#1E293B' : '#E2E8F0',
    dotBorder: isDark ? '#111B2E' : '#FFFFFF',
    departmentTones: DEPARTMENT_PASTEL_TONES.map((tone, idx) =>
      isDark
        ? { ...tone, ...DEPARTMENT_DARK_HATCHES[idx % DEPARTMENT_DARK_HATCHES.length]! }
        : tone,
    ),
    series: isDark
      ? {
          rose: {
            ...CHART_SERIES_TOKENS.rose,
            hatchBase: 'rgba(249, 168, 212, 0.16)',
            hatchLine: '#F9A8D4',
            border: '#F9A8D4',
            stroke: '#F9A8D4',
            dot: '#FBCFE8',
            fillStop: '#F9A8D4',
          },
          sky: {
            ...CHART_SERIES_TOKENS.sky,
            hatchBase: 'rgba(125, 211, 252, 0.16)',
            hatchLine: '#7DD3FC',
            border: '#7DD3FC',
            stroke: '#7DD3FC',
            dot: '#BAE6FD',
            fillStop: '#7DD3FC',
          },
          mint: {
            ...CHART_SERIES_TOKENS.mint,
            hatchBase: 'rgba(110, 231, 183, 0.16)',
            hatchLine: '#6EE7B7',
            border: '#6EE7B7',
            fill: '#6EE7B7',
          },
          violet: {
            hatchBase: 'rgba(196, 181, 253, 0.16)',
            hatchLine: '#C4B5FD',
            border: '#C4B5FD',
          },
        }
      : CHART_SERIES_TOKENS,
  } as const;
}
