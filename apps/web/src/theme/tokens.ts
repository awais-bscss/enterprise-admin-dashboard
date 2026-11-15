import type { AuditLogItem, ProjectCategory, ProjectStatus, Role } from '../types/auth';

export const SURFACE_TOKENS = {
  canvas: 'bg-canvas text-slate-900',
  card: 'bento-card',
  cardInteractive: 'bento-card transition hover:border-slate-300/80',
  panel: 'bento-shadow rounded-panel border border-slate-200/70 bg-surface',
  modalBackdrop: 'fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 p-4 backdrop-blur-[2px]',
  modalCard: 'bento-modal w-full p-6',
} as const;

export const BUTTON_TOKENS = {
  primarySoftPill:
    'inline-flex cursor-pointer items-center gap-2 rounded-full border border-sky-200/90 bg-sky-100/90 px-4 py-2 text-xs font-semibold text-sky-900 transition hover:bg-sky-200/80 disabled:cursor-not-allowed disabled:opacity-60',
  secondaryPill:
    'inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-200/80 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60',
  filterActive:
    'cursor-pointer rounded-full bg-sky-100 px-3.5 py-1.5 text-xs font-semibold text-sky-900 ring-1 ring-sky-200/80 transition',
  filterIdle:
    'cursor-pointer rounded-full bg-slate-50 px-3.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100',
  alertError: 'rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800',
  alertSuccess:
    'rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800',
} as const;

export const BADGE_TOKENS = {
  role: {
    admin: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/80',
    manager: 'bg-sky-50 text-sky-700 ring-1 ring-sky-200/80',
    viewer: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200/80',
  } satisfies Record<Role, string>,
  accountStatus: {
    active: 'bg-emerald-50 text-emerald-700',
    suspended: 'bg-rose-50 text-rose-700',
  } satisfies Record<'active' | 'suspended', string>,
  projectStatus: {
    completed: {
      label: 'Completed',
      className: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/70',
    },
    in_progress: {
      label: 'In Progress',
      className: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200/70',
    },
    upcoming: {
      label: 'Upcoming',
      className: 'bg-sky-50 text-sky-700 ring-1 ring-sky-200/70',
    },
  } satisfies Record<ProjectStatus, { label: string; className: string }>,
  projectCategory: {
    development: 'bg-rose-50/90 text-rose-700',
    design: 'bg-sky-50/90 text-sky-700',
    testing: 'bg-emerald-50/90 text-emerald-700',
    security: 'bg-violet-50/90 text-violet-700',
  } satisfies Record<ProjectCategory, string>,
  auditResource: {
    auth: 'bg-sky-50 text-sky-700',
    project: 'bg-emerald-50 text-emerald-700',
    user: 'bg-rose-50 text-rose-700',
    settings: 'bg-violet-50 text-violet-700',
    report: 'bg-amber-50 text-amber-800',
  } satisfies Record<AuditLogItem['resourceType'], string>,
  avatarTones: [
    'bg-emerald-100 text-emerald-800',
    'bg-sky-100 text-sky-800',
    'bg-rose-100 text-rose-800',
    'bg-violet-100 text-violet-800',
  ] as const,
} as const;

export type BentoTone = 'mint' | 'sky' | 'rose';

export const BENTO_TONE_TOKENS: Record<
  BentoTone,
  { ring: string; iconBg: string; iconText: string; badgeBg: string; badgeText: string }
> = {
  mint: {
    ring: 'ring-emerald-100',
    iconBg: 'bg-emerald-100/80',
    iconText: 'text-emerald-700',
    badgeBg: 'bg-emerald-50',
    badgeText: 'text-emerald-700',
  },
  sky: {
    ring: 'ring-sky-100',
    iconBg: 'bg-sky-100/80',
    iconText: 'text-sky-700',
    badgeBg: 'bg-sky-50',
    badgeText: 'text-sky-700',
  },
  rose: {
    ring: 'ring-rose-100',
    iconBg: 'bg-rose-100/80',
    iconText: 'text-rose-700',
    badgeBg: 'bg-rose-50',
    badgeText: 'text-rose-700',
  },
};

export const CHART_TOKENS = {
  axisTick: { fill: '#94A3B8', fontSize: 11, fontWeight: 500 },
  labelFill: '#475569',
  gridStroke: '#E2E8F0',
  tooltipCursor: 'rgba(241, 245, 249, 0.55)',
  emptySlice: '#E2E8F0',
  white: '#FFFFFF',
  series: {
    rose: {
      hatchBase: '#FBCFE8',
      hatchLine: '#F472B6',
      border: '#F9A8D4',
      stroke: '#F472B6',
      dot: '#EC4899',
      fillStop: '#F9A8D4',
      barClass: 'bg-rose-300',
    },
    sky: {
      hatchBase: '#BFDBFE',
      hatchLine: '#60A5FA',
      border: '#93C5FD',
      stroke: '#60A5FA',
      dot: '#3B82F6',
      fillStop: '#93C5FD',
      barClass: 'bg-sky-300',
    },
    mint: {
      hatchBase: '#BBF7D0',
      hatchLine: '#34D399',
      border: '#86EFAC',
      fill: '#86EFAC',
      barClass: 'bg-emerald-300',
    },
    violet: {
      hatchBase: '#DDD6FE',
      hatchLine: '#8B5CF6',
      border: '#C4B5FD',
    },
  },
} as const;
