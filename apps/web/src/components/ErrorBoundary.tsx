import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCw } from 'lucide-react';
import { BUTTON_TOKENS, SURFACE_TOKENS } from '../theme/tokens';

interface ErrorBoundaryProps {
  children: ReactNode;
  variant?: 'page' | 'section';
  sectionTitle?: string;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    message: '',
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error.message || 'Unexpected application error',
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('UI ErrorBoundary caught:', error, info.componentStack);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, message: '' });
    if (this.props.variant === 'section') {
      this.props.onReset?.();
      return;
    }
    window.location.reload();
  };

  render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    if (this.props.variant === 'section') {
      return (
        <section
          className={`${SURFACE_TOKENS.card} flex flex-wrap items-center justify-between gap-4 border-rose-200/80 p-5 dark:border-rose-500/40`}
          role="alert"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 ring-1 ring-rose-100 dark:bg-rose-500/15 dark:text-rose-300 dark:ring-rose-500/30">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {this.props.sectionTitle
                  ? `${this.props.sectionTitle} failed to render`
                  : 'Section unavailable'}
              </h2>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                {this.state.message}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={this.handleReset}
            className={BUTTON_TOKENS.secondaryPill}
          >
            <RotateCw className="h-3.5 w-3.5" />
            Retry section
          </button>
        </section>
      );
    }

    return (
      <main
        className={`flex min-h-screen items-center justify-center px-4 py-12 ${SURFACE_TOKENS.canvas}`}
      >
        <section
          className="bento-shadow w-full max-w-lg rounded-modal border border-slate-200/75 bg-surface p-7 dark:border-slate-700/80"
          role="alert"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 ring-1 ring-rose-100 dark:bg-rose-500/15 dark:text-rose-300 dark:ring-rose-500/30">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-xl font-bold tracking-tight">Something went wrong</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{this.state.message}</p>
          <button
            type="button"
            className={`mt-5 ${BUTTON_TOKENS.primarySoftPill} px-5 py-2.5 text-sm`}
            onClick={this.handleReset}
          >
            <RotateCw className="h-4 w-4" />
            Reload Page
          </button>
        </section>
      </main>
    );
  }
}
