import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { WorkspaceLoader } from '../../components/WorkspaceLoader';
import type { Permission, Role } from '../../types/auth';
import { useAuth } from './authContext';

interface ProtectedRouteProps {
  children: ReactNode;
  roles?: Role[];
  permission?: Permission;
}

export function ProtectedRoute({ children, roles, permission }: ProtectedRouteProps) {
  const { status, hasRole, hasPermission } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return <WorkspaceLoader />;
  }

  if (status !== 'authenticated') {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (roles && roles.length > 0 && !hasRole(...roles)) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (permission && !hasPermission(permission)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
