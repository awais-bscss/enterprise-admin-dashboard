interface CookieStoreMatch {
  value?: string;
}

interface CookieStoreApi {
  get: (name: string) => Promise<CookieStoreMatch | null>;
}

/**
 * Reads a cookie asynchronously via the Cookie Store API when available so
 * Chromium does not emit synchronous `document.cookie` performance issues.
 */
export async function getCookieAsync(name: string): Promise<string | null> {
  if (typeof window !== 'undefined' && 'cookieStore' in window) {
    try {
      const store = (window as Window & { cookieStore: CookieStoreApi }).cookieStore;
      const match = await store.get(name);
      return match?.value ? decodeURIComponent(match.value) : null;
    } catch {
      // Fallback to document.cookie if Cookie Store throws in restricted contexts.
    }
  }

  if (typeof document === 'undefined') return null;
  const prefix = `${encodeURIComponent(name)}=`;
  const parts = document.cookie.split(';');

  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.startsWith(prefix)) {
      return decodeURIComponent(trimmed.slice(prefix.length));
    }
  }

  return null;
}
