import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';
import { setAccessToken, setSessionExpiredHandler } from '../lib/api';
import { queryClient } from '../lib/queryClient';
import { server } from './mswServer';

// Skip background route preloading during unit tests.
vi.mock('../app/routePreload', () => ({
  loadDashboardPage: vi.fn(),
  loadDashboardChartsGrid: vi.fn(),
  loadProjectsPage: vi.fn(),
  loadDepartmentsPage: vi.fn(),
  loadClientsPage: vi.fn(),
  loadDirectoryPage: vi.fn(),
  loadAuditLogsPage: vi.fn(),
  loadReportsPage: vi.fn(),
  preloadRoute: vi.fn(),
}));

Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: vi.fn(),
});

if (!window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

if (!globalThis.ResizeObserver) {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

beforeAll(() => {
  server.listen({ onUnhandledFrame: 'error' });
});

afterEach(() => {
  server.resetHandlers();
  cleanup();
  document.cookie = 'csrf_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
  document.documentElement.classList.remove('dark');
  window.localStorage.clear();
  setAccessToken(null);
  setSessionExpiredHandler(null);
  queryClient.clear();
});

afterAll(() => {
  server.close();
});
