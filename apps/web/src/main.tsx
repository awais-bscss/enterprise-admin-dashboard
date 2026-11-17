import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';
import { applyInitialTheme } from './theme/themeContext';
import { ThemeProvider } from './theme/ThemeProvider';

applyInitialTheme();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </ThemeProvider>
  </StrictMode>,
);
