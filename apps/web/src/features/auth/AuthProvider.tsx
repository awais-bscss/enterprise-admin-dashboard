import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { setAccessToken, setSessionExpiredHandler } from '../../lib/api';
import { getCookie } from '../../lib/cookies';
import type { AuthSessionData, AuthUser, Permission, Role } from '../../types/auth';
import { loginRequest, logoutRequest, refreshSessionRequest } from './authApi';
import { AuthContext, type AuthStatus } from './authContext';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>(() =>
    getCookie('csrf_token') ? 'loading' : 'unauthenticated',
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
  }, []);

  useEffect(() => {
    setSessionExpiredHandler(() => {
      clearSession('Your session expired. Please sign in again.');
    });

    return () => setSessionExpiredHandler(null);
  }, [clearSession]);

  useEffect(() => {
    if (!getCookie('csrf_token')) return;

    let active = true;

    refreshSessionRequest()
      .then((session) => {
        if (!active) return;
        if (session) {
          applySession(session);
        } else {
          clearSession();
        }
      })
      .catch(() => {
        if (active) clearSession();
      });

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
        const session = await refreshSessionRequest();
        if (session) {
          applySession(session);
        } else {
          clearSession('Your session expired. Please sign in again.');
        }
      } catch {
        clearSession('Your session expired. Please sign in again.');
      }
    }, refreshDelay);

    return () => window.clearTimeout(timer);
  }, [status, expiresAt, applySession, clearSession]);

  const login = useCallback(
    async (email: string, password: string) => {
      const session = await loginRequest(email, password);
      applySession(session);
    },
    [applySession],
  );

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } finally {
      clearSession();
    }
  }, [clearSession]);

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

  return (
    <AuthContext.Provider
      value={{
        user,
        status,
        sessionNotice,
        expiresAt,
        login,
        logout,
        clearSessionNotice,
        hasRole,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
