import type { AuthUser, Permission } from '../../types/auth';

export const ROUTE_PERMISSIONS: Record<string, Permission | undefined> = {
  '/dashboard': undefined,
  '/projects': 'projects:read',
  '/departments': 'departments:read',
  '/clients': 'clients:read',
  '/employees': 'users:read',
  '/users': 'users:read',
  '/directory': 'users:read',
  '/audit': 'audit:read',
  '/reports': 'reports:export',
};

export function canUserAccessPath(user: AuthUser | null, pathname: string): boolean {
  if (!user) return false;
  const cleanPath = pathname.split('?')[0] ?? pathname;
  if (cleanPath === '/login' || cleanPath === '/unauthorized') return false;
  if (!(cleanPath in ROUTE_PERMISSIONS)) return false;
  const required = ROUTE_PERMISSIONS[cleanPath];
  return !required || user.permissions.includes(required);
}

export function resolveLoginDestination(user: AuthUser | null, requestedPath?: string): string {
  if (requestedPath && requestedPath.startsWith('/') && canUserAccessPath(user, requestedPath)) {
    return requestedPath;
  }
  return '/dashboard';
}
