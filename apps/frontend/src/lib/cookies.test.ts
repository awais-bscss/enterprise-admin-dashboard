import { afterEach, describe, expect, it, vi } from 'vitest';
import { getCookieAsync } from './cookies';

describe('getCookieAsync', () => {
  afterEach(() => {
    delete (window as unknown as Record<string, unknown>).cookieStore;
  });

  it('reads decoded values via Cookie Store API when supported without throwing', async () => {
    const getSpy = vi.fn().mockResolvedValue({ value: encodeURIComponent('csrf.token+sig') });
    Object.defineProperty(window, 'cookieStore', {
      configurable: true,
      value: { get: getSpy },
    });

    const token = await getCookieAsync('csrf_token');
    expect(getSpy).toHaveBeenCalledWith('csrf_token');
    expect(token).toBe('csrf.token+sig');
  });

  it('falls back to document.cookie when Cookie Store is absent or rejects', async () => {
    document.cookie = 'csrf_token=fallback.csrf; path=/';
    Object.defineProperty(window, 'cookieStore', {
      configurable: true,
      value: {
        get: vi.fn().mockRejectedValue(new Error('SecurityError')),
      },
    });

    expect(await getCookieAsync('csrf_token')).toBe('fallback.csrf');
    expect(await getCookieAsync('missing_cookie')).toBeNull();
  });
});
