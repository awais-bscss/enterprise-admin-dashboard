import { LoaderCircle } from 'lucide-react';
import { SURFACE_TOKENS } from '../theme/tokens';

export function WorkspaceLoader() {
  return (
    <main
      className={`flex min-h-screen items-center justify-center px-4 py-12 ${SURFACE_TOKENS.canvas}`}
    >
      <section
        className={`${SURFACE_TOKENS.panel} flex items-center gap-3 px-6 py-5`}
        aria-busy="true"
        aria-live="polite"
      >
        <LoaderCircle className="h-5 w-5 animate-spin text-sky-600 dark:text-sky-400" />
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
          Loading workspace...
        </p>
      </section>
    </main>
  );
}
