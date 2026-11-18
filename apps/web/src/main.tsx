import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { preloadRoute } from './app/routePreload';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';
import { refreshSession } from './lib/api';
import { getCookie } from './lib/cookies';
import { applyInitialTheme } from './theme/themeContext';
import { ThemeProvider } from './theme/ThemeProvider';

applyInitialTheme();

if (getCookie('csrf_token')) {
  const pathname = window.location.pathname;
  if (pathname !== '/login' && pathname !== '/unauthorized') {
    preloadRoute(pathname);
    void refreshSession();
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </ThemeProvider>
  </StrictMode>,
);
