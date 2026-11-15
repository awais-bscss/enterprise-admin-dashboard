import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { LoaderCircle } from 'lucide-react';
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
      <main className="flex min-h-screen items-center justify-center bg-[#f5f7fa] px-4 py-12">
        <section
          className="bento-shadow flex items-center gap-3 rounded-[24px] border border-slate-200/70 bg-white px-6 py-5"
          aria-busy="true"
          aria-live="polite"
        >
          <LoaderCircle className="h-5 w-5 animate-spin text-sky-600" />
          <p className="text-sm font-medium text-slate-600">Verifying workspace session...</p>
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
