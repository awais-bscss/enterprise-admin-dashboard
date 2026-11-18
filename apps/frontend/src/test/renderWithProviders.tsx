import type { ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { MemoryRouter, type MemoryRouterProps } from 'react-router-dom';
import { ToastProvider } from '../components/toast/ToastProvider';
import { AuthProvider } from '../features/auth/AuthProvider';
import { queryClient } from '../lib/queryClient';
import { ThemeProvider } from '../theme/ThemeProvider';

interface RenderWithProvidersOptions {
  initialEntries?: MemoryRouterProps['initialEntries'];
}

export function renderWithProviders(
  ui: ReactNode,
  { initialEntries = ['/'] }: RenderWithProvidersOptions = {},
) {
  queryClient.clear();

  return render(
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <MemoryRouter initialEntries={initialEntries}>
            <AuthProvider>{ui}</AuthProvider>
          </MemoryRouter>
        </ToastProvider>
      </QueryClientProvider>
    </ThemeProvider>,
  );
}
