import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';
import { refreshSession } from './lib/api';
import { getCookieAsync } from './lib/cookies';
import { applyInitialTheme } from './theme/themeContext';
import { ThemeProvider } from './theme/ThemeProvider';

applyInitialTheme();

void (async () => {
  const pathname = window.location.pathname;
  if (pathname === '/login' || pathname === '/unauthorized') return;
  const csrfToken = await getCookieAsync('csrf_token');
  if (csrfToken) {
    void refreshSession();
  }
})();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </ThemeProvider>
  </StrictMode>,
);
