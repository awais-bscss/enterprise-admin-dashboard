import type { DeadlineUrgency } from '../types/auth';

const DAY_MS = 24 * 60 * 60 * 1000;

export function getInitials(name: string | undefined, fallback = 'EA'): string {
  if (!name?.trim()) return fallback;
  const parts = name.trim().split(/\s+/);
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function getUtcDaysRemaining(isoDate: string): number {
  const target = new Date(isoDate);
  const now = new Date();
  const targetUtc = Date.UTC(target.getUTCFullYear(), target.getUTCMonth(), target.getUTCDate());
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return Math.round((targetUtc - todayUtc) / DAY_MS);
}

export function getDeadlineUrgency(daysRemaining: number): DeadlineUrgency | null {
  if (daysRemaining <= 3) return 'critical';
  if (daysRemaining <= 7) return 'warning';
  if (daysRemaining <= 14) return 'upcoming';
  return null;
}

export function formatDeadlineCountdown(daysRemaining: number): string {
  if (daysRemaining < 0) return `${Math.abs(daysRemaining)}d overdue`;
  if (daysRemaining === 0) return 'Due today';
  if (daysRemaining === 1) return 'Due tomorrow';
  return `In ${daysRemaining} days`;
}

export function formatRelativeUpdated(isoDate: string): { label: string; isRecent: boolean } {
  const diffMs = Math.max(0, Date.now() - new Date(isoDate).getTime());
  const mins = Math.floor(diffMs / 60_000);
  const hours = Math.floor(diffMs / 3_600_000);
  const days = Math.floor(diffMs / DAY_MS);

  if (mins < 1) return { label: 'Updated just now', isRecent: true };
  if (mins < 60) return { label: `Updated ${mins}m ago`, isRecent: true };
  if (hours < 24) return { label: `Updated ${hours}h ago`, isRecent: true };
  if (days <= 2) return { label: `Updated ${days}d ago`, isRecent: true };
  if (days < 7) return { label: `Updated ${days}d ago`, isRecent: false };
  return {
    label: `Updated ${new Date(isoDate).toLocaleDateString()}`,
    isRecent: false,
  };
}

export function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
