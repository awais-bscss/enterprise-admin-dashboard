import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
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
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-12">
        <section
          className="mx-auto max-w-4xl rounded-xl border border-slate-200 bg-white p-6 shadow-xs"
          aria-busy="true"
          aria-live="polite"
        >
          <p className="text-sm text-slate-600">Verifying session...</p>
        </section>
      </main>
    );
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
