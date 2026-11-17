import type { AuditLogItem, ProjectCategory, ProjectStatus, Role } from '../types/auth';

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
  projectCategory: {
    development: 'bg-rose-50/90 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
    design: 'bg-sky-50/90 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
    testing: 'bg-emerald-50/90 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
    security: 'bg-violet-50/90 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
  } satisfies Record<ProjectCategory, string>,
  auditResource: {
    auth: 'bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300',
    project: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
    user: 'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
    settings: 'bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300',
    report: 'bg-amber-50 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
  } satisfies Record<AuditLogItem['resourceType'], string>,
  avatarTones: [
    'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200',
    'bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-200',
    'bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-200',
    'bg-violet-100 text-violet-800 dark:bg-violet-500/20 dark:text-violet-200',
  ] as const,
} as const;

export type BentoTone = 'mint' | 'sky' | 'rose';

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
  rose: {
    ring: 'ring-rose-100 dark:ring-rose-500/20',
    iconBg: 'bg-rose-100/80 dark:bg-rose-500/15',
    iconText: 'text-rose-700 dark:text-rose-300',
    badgeBg: 'bg-rose-50 dark:bg-rose-500/15',
    badgeText: 'text-rose-700 dark:text-rose-300',
  },
};

export const CHART_SERIES_TOKENS = {
  rose: {
    hatchBase: '#FCE7F3',
    hatchLine: '#F472B6',
    border: '#F9A8D4',
    stroke: '#EC4899',
    dot: '#DB2777',
    fillStop: '#F9A8D4',
    barClass: 'bg-rose-400 dark:bg-rose-400',
  },
  sky: {
    hatchBase: '#DBEAFE',
    hatchLine: '#60A5FA',
    border: '#93C5FD',
    stroke: '#3B82F6',
    dot: '#2563EB',
    fillStop: '#60A5FA',
    barClass: 'bg-sky-400 dark:bg-sky-400',
  },
  mint: {
    hatchBase: '#D1FAE5',
    hatchLine: '#34D399',
    border: '#6EE7B7',
    fill: '#6EE7B7',
    barClass: 'bg-emerald-400 dark:bg-emerald-400',
  },
  violet: {
    hatchBase: '#EDE9FE',
    hatchLine: '#8B5CF6',
    border: '#C4B5FD',
  },
} as const;

export function getChartPalette(isDark: boolean) {
  return {
    axisTick: {
      fill: isDark ? '#94A3B8' : '#475569',
      fontSize: 11,
      fontWeight: 500,
    },
    labelFill: isDark ? '#CBD5E1' : '#334155',
    gridStroke: isDark ? 'rgba(51, 65, 85, 0.7)' : '#E2E8F0',
    tooltipCursor: isDark ? 'rgba(30, 41, 59, 0.55)' : 'rgba(226, 232, 240, 0.55)',
    emptySlice: isDark ? '#1E293B' : '#E2E8F0',
    dotBorder: isDark ? '#111B2E' : '#FFFFFF',
    series: isDark
      ? {
          rose: {
            ...CHART_SERIES_TOKENS.rose,
            hatchBase: 'rgba(244, 114, 182, 0.24)',
            hatchLine: '#F472B6',
            border: '#F472B6',
            stroke: '#F472B6',
            dot: '#F9A8D4',
            fillStop: '#F472B6',
          },
          sky: {
            ...CHART_SERIES_TOKENS.sky,
            hatchBase: 'rgba(56, 189, 248, 0.24)',
            hatchLine: '#38BDF8',
            border: '#60A5FA',
            stroke: '#38BDF8',
            dot: '#7DD3FC',
            fillStop: '#38BDF8',
          },
          mint: {
            ...CHART_SERIES_TOKENS.mint,
            hatchBase: 'rgba(52, 211, 153, 0.24)',
            hatchLine: '#34D399',
            border: '#34D399',
            fill: '#34D399',
          },
          violet: {
            hatchBase: 'rgba(167, 139, 250, 0.24)',
            hatchLine: '#A78BFA',
            border: '#A78BFA',
          },
        }
      : CHART_SERIES_TOKENS,
  } as const;
}
