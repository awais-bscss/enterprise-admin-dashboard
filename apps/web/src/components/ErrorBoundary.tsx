import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
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

  render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f7fa] px-4 py-12 text-slate-900">
        <section
          className="bento-shadow w-full max-w-lg rounded-[28px] border border-slate-200/75 bg-white p-7"
          role="alert"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 ring-1 ring-rose-100">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-xl font-bold tracking-tight">Something went wrong</h1>
          <p className="mt-2 text-sm text-slate-500">{this.state.message}</p>
          <button
            type="button"
            className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-full border border-sky-200/90 bg-sky-100/90 px-5 py-2.5 text-sm font-semibold text-sky-900 transition hover:bg-sky-200/80"
            onClick={() => window.location.reload()}
          >
            <RotateCw className="h-4 w-4" />
            Reload Page
          </button>
        </section>
      </main>
    );
  }
}
