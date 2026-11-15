import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { LoaderCircle } from 'lucide-react';
import { AuthProvider } from '../features/auth/AuthProvider';
import { LoginPage } from '../features/auth/LoginPage';
import { ProtectedRoute } from '../features/auth/ProtectedRoute';
import { UnauthorizedPage } from '../features/auth/UnauthorizedPage';

const DashboardPage = lazy(() =>
  import('../features/dashboard/DashboardPage').then((mod) => ({ default: mod.DashboardPage })),
);

const ProjectsPage = lazy(() =>
  import('../features/projects/ProjectsPage').then((mod) => ({ default: mod.ProjectsPage })),
);

const DirectoryPage = lazy(() =>
  import('../features/directory/DirectoryPage').then((mod) => ({ default: mod.DirectoryPage })),
);

const AuditLogsPage = lazy(() =>
  import('../features/workspace/AuditLogsPage').then((mod) => ({ default: mod.AuditLogsPage })),
);

const ReportsPage = lazy(() =>
  import('../features/workspace/ReportsPage').then((mod) => ({ default: mod.ReportsPage })),
);

const SettingsPage = lazy(() =>
  import('../features/workspace/SettingsPage').then((mod) => ({ default: mod.SettingsPage })),
);

function PageLoader() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f7fa] px-4 py-12">
      <div className="bento-shadow flex items-center gap-3 rounded-[24px] border border-slate-200/70 bg-white px-6 py-5">
        <LoaderCircle className="h-5 w-5 animate-spin text-sky-600" />
        <span className="text-sm font-medium text-slate-600">Loading workspace...</span>
      </div>
    </main>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects"
              element={
                <ProtectedRoute permission="projects:read">
                  <ProjectsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/users"
              element={
                <ProtectedRoute permission="users:read">
                  <DirectoryPage />
                </ProtectedRoute>
              }
            />
            <Route path="/directory" element={<Navigate to="/users" replace />} />
            <Route
              path="/audit"
              element={
                <ProtectedRoute permission="audit:read">
                  <AuditLogsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute permission="reports:export">
                  <ReportsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute permission="settings:manage">
                  <SettingsPage />
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}
