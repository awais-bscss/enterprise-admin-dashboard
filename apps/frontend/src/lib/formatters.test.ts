import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  formatDeadlineCountdown,
  formatRelativeUpdated,
  getDeadlineUrgency,
  getInitials,
  getUtcDaysRemaining,
} from './formatters';

describe('formatters utilities', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('extracts initials cleanly for single, multi-word, and blank names', () => {
    expect(getInitials('Alex Morgan')).toBe('AM');
    expect(getInitials('Zainab').trim()).toBe('Z');
    expect(getInitials('   ', 'NA')).toBe('NA');
    expect(getInitials(undefined)).toBe('EA');
  });

  it('computes UTC days remaining and maps deadline urgency thresholds', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-18T12:00:00.000Z'));

    expect(getUtcDaysRemaining('2026-11-16T08:00:00.000Z')).toBe(-2);
    expect(getUtcDaysRemaining('2026-11-18T23:59:00.000Z')).toBe(0);
    expect(getUtcDaysRemaining('2026-11-21T00:00:00.000Z')).toBe(3);

    expect(getDeadlineUrgency(-1)).toBe('critical');
    expect(getDeadlineUrgency(3)).toBe('critical');
    expect(getDeadlineUrgency(4)).toBe('warning');
    expect(getDeadlineUrgency(7)).toBe('warning');
    expect(getDeadlineUrgency(8)).toBe('upcoming');
    expect(getDeadlineUrgency(14)).toBe('upcoming');
    expect(getDeadlineUrgency(15)).toBeNull();
  });

  it('formats countdown labels for overdue, today, tomorrow, and upcoming deadlines', () => {
    expect(formatDeadlineCountdown(-3)).toBe('3d overdue');
    expect(formatDeadlineCountdown(0)).toBe('Due today');
    expect(formatDeadlineCountdown(1)).toBe('Due tomorrow');
    expect(formatDeadlineCountdown(9)).toBe('In 9 days');
  });

  it('formats relative updated timestamps and recent badge threshold (<= 2 days)', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-18T12:00:00.000Z'));

    expect(formatRelativeUpdated('2026-11-18T11:59:45.000Z')).toEqual({
      label: 'Updated just now',
      isRecent: true,
    });
    expect(formatRelativeUpdated('2026-11-18T11:30:00.000Z')).toEqual({
      label: 'Updated 30m ago',
      isRecent: true,
    });
    expect(formatRelativeUpdated('2026-11-17T12:00:00.000Z')).toEqual({
      label: 'Updated 1d ago',
      isRecent: true,
    });
    expect(formatRelativeUpdated('2026-11-14T12:00:00.000Z')).toEqual({
      label: 'Updated 4d ago',
      isRecent: false,
    });
  });
});
