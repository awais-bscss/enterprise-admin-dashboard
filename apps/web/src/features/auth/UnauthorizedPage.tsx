import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldAlert } from 'lucide-react';

export function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f7fa] px-4 py-8 text-slate-900">
      <section
        className="bento-shadow w-full max-w-md rounded-[28px] border border-slate-200/75 bg-white p-7"
        role="alert"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 ring-1 ring-rose-100">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h1 className="mt-4 text-xl font-bold tracking-tight text-slate-900">Access Restricted</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          Your current role does not include permission to open this workspace section.
        </p>
        <div className="mt-6">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 rounded-full border border-sky-200/90 bg-sky-100/90 px-5 py-2.5 text-sm font-semibold text-sky-900 transition hover:bg-sky-200/80"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Overview
          </Link>
        </div>
      </section>
    </main>
  );
}
