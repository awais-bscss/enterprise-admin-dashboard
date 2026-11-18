import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { ToastContext, type ToastItem, type ToastVariant } from './toastContext';

const AUTO_DISMISS_MS = 4000;
const MAX_VISIBLE_TOASTS = 4;

const VARIANT_STYLES: Record<
  ToastVariant,
  { container: string; icon: typeof CheckCircle2; iconClass: string }
> = {
  success: {
    container:
      'border-emerald-200 bg-white/95 text-emerald-950 dark:border-emerald-500/40 dark:bg-slate-900/95 dark:text-emerald-100',
    icon: CheckCircle2,
    iconClass: 'text-emerald-600 dark:text-emerald-400',
  },
  error: {
    container:
      'border-rose-200 bg-white/95 text-rose-950 dark:border-rose-500/40 dark:bg-slate-900/95 dark:text-rose-100',
    icon: AlertCircle,
    iconClass: 'text-rose-600 dark:text-rose-400',
  },
  info: {
    container:
      'border-sky-200 bg-white/95 text-slate-900 dark:border-sky-500/40 dark:bg-slate-900/95 dark:text-sky-100',
    icon: Info,
    iconClass: 'text-sky-600 dark:text-sky-400',
  },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef<Map<string, number>>(new Map());
  const counterRef = useRef(0);

  const dismiss = useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer !== undefined) {
      window.clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const pushToast = useCallback(
    (variant: ToastVariant, message: string) => {
      const id = `toast-${++counterRef.current}`;
      setToasts((prev) => {
        const next = [...prev, { id, variant, message }];
        return next.length > MAX_VISIBLE_TOASTS
          ? next.slice(next.length - MAX_VISIBLE_TOASTS)
          : next;
      });

      const timer = window.setTimeout(() => {
        timersRef.current.delete(id);
        setToasts((prev) => prev.filter((item) => item.id !== id));
      }, AUTO_DISMISS_MS);

      timersRef.current.set(id, timer);
    },
    [],
  );

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      for (const timer of timers.values()) {
        window.clearTimeout(timer);
      }
      timers.clear();
    };
  }, []);

  const value = useMemo(
    () => ({
      success: (message: string) => pushToast('success', message),
      error: (message: string) => pushToast('error', message),
      info: (message: string) => pushToast('info', message),
      dismiss,
    }),
    [pushToast, dismiss],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}

      {toasts.length > 0 ? (
        <aside
          aria-label="Notifications"
          aria-live="polite"
          className="pointer-events-none fixed top-4 left-1/2 z-[60] flex w-[calc(100vw-2rem)] max-w-sm -translate-x-1/2 flex-col gap-2.5"
        >
          {toasts.map((item) => {
            const style = VARIANT_STYLES[item.variant];
            const Icon = style.icon;
            return (
              <div
                key={item.id}
                role={item.variant === 'error' ? 'alert' : 'status'}
                className={`bento-shadow pointer-events-auto flex items-start gap-2.5 rounded-2xl border px-3.5 py-3 text-xs font-medium backdrop-blur-md transition ${style.container}`}
              >
                <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${style.iconClass}`} />
                <p className="min-w-0 flex-1 leading-relaxed">{item.message}</p>
                <button
                  type="button"
                  onClick={() => dismiss(item.id)}
                  aria-label="Dismiss notification"
                  className="flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-full opacity-60 transition hover:bg-slate-200/50 hover:opacity-100 dark:hover:bg-slate-700/70"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </aside>
      ) : null}
    </ToastContext.Provider>
  );
}
