import type { ReactNode } from 'react';
import { ErrorAlertBanner } from '../../../components/ErrorAlertBanner';
import { ErrorBoundary } from '../../../components/ErrorBoundary';
import {
  ChartSkeletonCard,
  type ChartSkeletonVariant,
} from '../../../components/WorkspaceSkeletons';
import { SURFACE_TOKENS } from '../../../theme/tokens';

interface ChartCardFrameProps {
  title: string;
  variant?: ChartSkeletonVariant;
  loading: boolean;
  retrying: boolean;
  error: string | null;
  onRetry: () => void;
  children: ReactNode;
}

export function ChartCardFrame({
  title,
  variant = 'trend',
  loading,
  retrying,
  error,
  onRetry,
  children,
}: ChartCardFrameProps) {
  if (loading) {
    return <ChartSkeletonCard variant={variant} ariaLabel={`Loading ${title}`} />;
  }

  if (error) {
    return (
      <article className={`${SURFACE_TOKENS.card} flex min-h-[396px] flex-col justify-between p-5`}>
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
        <div className="my-auto">
          <ErrorAlertBanner message={error} onRetry={onRetry} retrying={retrying} />
        </div>
      </article>
    );
  }

  return (
    <ErrorBoundary variant="section" sectionTitle={title} onReset={onRetry}>
      {children}
    </ErrorBoundary>
  );
}
