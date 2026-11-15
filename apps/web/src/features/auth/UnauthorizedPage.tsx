import { Link } from 'react-router-dom';

export function UnauthorizedPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8">
      <section
        className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xs"
        role="alert"
      >
        <h1 className="text-xl font-semibold text-slate-900">Access Restricted</h1>
        <p className="mt-2 text-sm text-slate-600">
          Your current role does not have permission to view this section.
        </p>
        <div className="mt-5">
          <Link
            to="/dashboard"
            className="inline-flex items-center rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
          >
            Back to Dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}
