import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
import { preloadRoute } from '../../app/routePreload';
import { BUTTON_TOKENS, SURFACE_TOKENS } from '../../theme/tokens';

export function UnauthorizedPage() {
  useEffect(() => {
    preloadRoute('/dashboard');
  }, []);

  return (
    <main className={`flex min-h-screen items-center justify-center px-4 py-8 ${SURFACE_TOKENS.canvas}`}>
      <section className={`${SURFACE_TOKENS.card} w-full max-w-md p-7`} role="alert">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 ring-1 ring-rose-100 dark:bg-rose-500/15 dark:text-rose-300 dark:ring-rose-500/30">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h1 className="mt-4 text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Access Restricted
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          Your current role does not include permission to open this workspace section.
        </p>
        <div className="mt-6">
          <Link to="/dashboard" className={`${BUTTON_TOKENS.primarySoftPill} px-5 py-2.5 text-sm`}>
            <ArrowLeft className="h-4 w-4" />
            Back to Overview
          </Link>
        </div>
      </section>
    </main>
  );
}
