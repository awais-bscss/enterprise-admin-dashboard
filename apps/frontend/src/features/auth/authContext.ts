import { createContext, useContext } from 'react';
import type { AuthUser, Permission, Role } from '../../types/auth';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export interface AuthContextValue {
  user: AuthUser | null;
  status: AuthStatus;
  sessionNotice: string | null;
  expiresAt: number | null;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  updateProfile: (payload: {
    name?: string;
    currentPassword?: string;
    newPassword?: string;
  }) => Promise<void>;
  clearSessionNotice: () => void;
  hasRole: (...roles: Role[]) => boolean;
  hasPermission: (permission: Permission) => boolean;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
