import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { preloadRoute } from '../../app/routePreload';
import { useToast } from '../../components/toast/toastContext';
import { setAccessToken, setSessionExpiredHandler } from '../../lib/api';
import { getCookieAsync } from '../../lib/cookies';
import { queryClient } from '../../lib/queryClient';
import { authService } from '../../services/apiService';
import type { AuthSessionData, AuthUser, Permission, Role } from '../../types/auth';
import { AuthContext, type AuthStatus } from './authContext';

function isPublicAuthPath(pathname: string): boolean {
  return pathname === '/login' || pathname === '/unauthorized';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const toast = useToast();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>(() =>
    typeof window !== 'undefined' && isPublicAuthPath(window.location.pathname)
      ? 'unauthenticated'
      : 'loading',
  );
  const [sessionNotice, setSessionNotice] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);

  const applySession = useCallback((session: AuthSessionData) => {
    setAccessToken(session.accessToken);
    setUser(session.user);
    setExpiresAt(Date.now() + session.expiresIn * 1000);
    setStatus('authenticated');
    setSessionNotice(null);
  }, []);

  const clearSession = useCallback((notice: string | null = null) => {
    setAccessToken(null);
    setUser(null);
    setExpiresAt(null);
    setStatus('unauthenticated');
    setSessionNotice(notice);
    queryClient.clear();
  }, []);

  useEffect(() => {
    setSessionExpiredHandler(() => {
      const expiredMessage = 'Your session expired. Please sign in again.';
      clearSession(expiredMessage);
      toast.error(expiredMessage);
    });

    return () => setSessionExpiredHandler(null);
  }, [clearSession, toast]);

  useEffect(() => {
    let active = true;

    void (async () => {
      const csrf = await getCookieAsync('csrf_token');
      if (!active) return;

      if (!csrf) {
        clearSession();
        return;
      }

      if (!isPublicAuthPath(window.location.pathname)) {
        preloadRoute(window.location.pathname);
        preloadRoute('/dashboard');
      }

      try {
        const session = await authService.refresh();
        if (!active) return;
        if (session) {
          applySession(session);
        } else {
          clearSession();
        }
      } catch {
        if (active) clearSession();
      }
    })();

    return () => {
      active = false;
    };
  }, [applySession, clearSession]);

  // Proactively refresh access token 60s before expiry while session is active.
  useEffect(() => {
    if (status !== 'authenticated' || !expiresAt) return;

    const refreshDelay = Math.max(expiresAt - Date.now() - 60_000, 15_000);
    const timer = window.setTimeout(async () => {
      try {
        const session = await authService.refresh();
        if (session) {
          applySession(session);
        } else {
          const message = 'Your session expired. Please sign in again.';
          clearSession(message);
          toast.error(message);
        }
      } catch {
        const message = 'Your session expired. Please sign in again.';
        clearSession(message);
        toast.error(message);
      }
    }, refreshDelay);

    return () => window.clearTimeout(timer);
  }, [status, expiresAt, applySession, clearSession, toast]);

  const login = useCallback(
    async (email: string, password: string): Promise<AuthUser> => {
      const session = await authService.login(email, password);
      queryClient.clear();
      applySession(session);
      return session.user;
    },
    [applySession],
  );

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      clearSession();
      toast.info('Signed out successfully.');
      navigate('/login', { replace: true, state: null });
    }
  }, [clearSession, navigate, toast]);

  const updateProfile = useCallback(
    async (payload: { name?: string; currentPassword?: string; newPassword?: string }) => {
      const updatedUser = await authService.updateProfile(payload);
      setUser(updatedUser);
    },
    [],
  );

  const clearSessionNotice = useCallback(() => {
    setSessionNotice(null);
  }, []);

  const hasRole = useCallback(
    (...roles: Role[]) => Boolean(user && roles.includes(user.role)),
    [user],
  );

  const hasPermission = useCallback(
    (permission: Permission) => Boolean(user && user.permissions.includes(permission)),
    [user],
  );

  const value = useMemo(
    () => ({
      user,
      status,
      sessionNotice,
      expiresAt,
      login,
      logout,
      updateProfile,
      clearSessionNotice,
      hasRole,
      hasPermission,
    }),
    [
      user,
      status,
      sessionNotice,
      expiresAt,
      login,
      logout,
      updateProfile,
      clearSessionNotice,
      hasRole,
      hasPermission,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
