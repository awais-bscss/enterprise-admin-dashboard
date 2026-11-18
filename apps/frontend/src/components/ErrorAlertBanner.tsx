import { AlertCircle, RotateCw } from 'lucide-react';
import { BUTTON_TOKENS } from '../theme/tokens';

interface ErrorAlertBannerProps {
  message: string;
  onRetry?: () => void;
  retrying?: boolean;
}

export function ErrorAlertBanner({
  message,
  onRetry,
  retrying = false,
}: ErrorAlertBannerProps) {
  return (
    <div
      className={`${BUTTON_TOKENS.alertError} flex flex-wrap items-center justify-between gap-3`}
      role="alert"
    >
      <div className="flex items-center gap-2.5">
        <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
        <span>{message}</span>
      </div>

      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          disabled={retrying}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-rose-200 bg-white px-3 py-1 text-xs font-semibold text-rose-800 transition hover:bg-rose-100/70 disabled:cursor-not-allowed disabled:opacity-60 dark:border-rose-500/40 dark:bg-rose-950/70 dark:text-rose-200 dark:hover:bg-rose-900/60"
        >
          <RotateCw className={`h-3.5 w-3.5 ${retrying ? 'animate-spin' : ''}`} />
          {retrying ? 'Retrying...' : 'Retry'}
        </button>
      ) : null}
    </div>
  );
}
