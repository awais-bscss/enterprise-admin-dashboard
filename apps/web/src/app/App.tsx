import { lazy, Suspense } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ToastProvider } from '../components/toast/ToastProvider';
import { WorkspaceLoader } from '../components/WorkspaceLoader';
import { AuthProvider } from '../features/auth/AuthProvider';
import { LoginPage } from '../features/auth/LoginPage';
import { ProtectedRoute } from '../features/auth/ProtectedRoute';
import { UnauthorizedPage } from '../features/auth/UnauthorizedPage';
import { queryClient } from '../lib/queryClient';
import {
  loadAuditLogsPage,
  loadDashboardPage,
  loadDirectoryPage,
  loadProjectsPage,
  loadReportsPage,
  loadSettingsPage,
} from './routePreload';

const DashboardPage = lazy(loadDashboardPage);
const ProjectsPage = lazy(loadProjectsPage);
const DirectoryPage = lazy(loadDirectoryPage);
const AuditLogsPage = lazy(loadAuditLogsPage);
const ReportsPage = lazy(loadReportsPage);
const SettingsPage = lazy(loadSettingsPage);

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <BrowserRouter>
          <AuthProvider>
            <Suspense fallback={<WorkspaceLoader />}>
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
      </ToastProvider>
    </QueryClientProvider>
  );
}
