import { createContext, useContext } from 'react';

export type ThemeMode = 'system' | 'light' | 'dark';

export const THEME_STORAGE_KEY = 'pms-theme';

export function resolveSystemDark(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function resolveInitialTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'system';
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'system' || stored === 'light' || stored === 'dark') {
      return stored;
    }
    return 'system';
  } catch {
    return 'system';
  }
}

export function resolveEffectiveDark(mode: ThemeMode): boolean {
  if (mode === 'dark') return true;
  if (mode === 'light') return false;
  return resolveSystemDark();
}

export function applyThemeToDom(mode: ThemeMode): boolean {
  const effectiveDark = resolveEffectiveDark(mode);
  if (typeof document !== 'undefined') {
    document.documentElement.classList.toggle('dark', effectiveDark);
  }
  return effectiveDark;
}

export function applyInitialTheme(): ThemeMode {
  const initial = resolveInitialTheme();
  applyThemeToDom(initial);
  return initial;
}

export interface ThemeContextValue {
  theme: ThemeMode;
  isDark: boolean;
  setTheme: (next: ThemeMode) => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used inside ThemeProvider');
  }
  return ctx;
}
