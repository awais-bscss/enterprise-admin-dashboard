import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  applyInitialTheme,
  applyThemeToDom,
  resolveSystemDark,
  THEME_STORAGE_KEY,
  ThemeContext,
  type ThemeMode,
} from './themeContext';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(() => applyInitialTheme());
  const [systemDark, setSystemDark] = useState<boolean>(() => resolveSystemDark());

  useEffect(() => {
    applyThemeToDom(theme);
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Ignore storage access failures in private browsing modes.
    }
  }, [theme, systemDark]);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      setSystemDark(media.matches);
      if (theme === 'system') {
        applyThemeToDom('system');
      }
    };
    media.addEventListener?.('change', handleChange);
    return () => media.removeEventListener?.('change', handleChange);
  }, [theme]);

  const setTheme = useCallback((next: ThemeMode) => {
    setThemeState(next);
  }, []);

  const isDark = theme === 'dark' || (theme === 'system' && systemDark);

  const value = useMemo(
    () => ({
      theme,
      isDark,
      setTheme,
    }),
    [theme, isDark, setTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
