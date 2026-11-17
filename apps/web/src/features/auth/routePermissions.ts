import type { AuthUser, Permission } from '../../types/auth';

export const ROUTE_PERMISSIONS: Record<string, Permission | undefined> = {
  '/dashboard': undefined,
  '/projects': 'projects:read',
  '/users': 'users:read',
  '/directory': 'users:read',
  '/audit': 'audit:read',
  '/reports': 'reports:export',
  '/settings': 'settings:manage',
};

export function canUserAccessPath(user: AuthUser | null, pathname: string): boolean {
  if (!user) return false;
  if (pathname === '/login' || pathname === '/unauthorized') return false;
  const required = ROUTE_PERMISSIONS[pathname];
  return !required || user.permissions.includes(required);
}

export function resolveLoginDestination(user: AuthUser | null, requestedPath?: string): string {
  if (requestedPath && requestedPath.startsWith('/') && canUserAccessPath(user, requestedPath)) {
    return requestedPath;
  }
  return '/dashboard';
}
