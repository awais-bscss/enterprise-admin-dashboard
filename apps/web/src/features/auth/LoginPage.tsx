import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ApiError } from '../../lib/api';
import { useAuth } from './authContext';

interface LocationState {
  from?: {
    pathname?: string;
  };
}

const DEMO_ACCOUNTS = [
  { label: 'Admin', email: 'admin@enterprise.dev', password: 'Admin@12345' },
  { label: 'Manager', email: 'manager@enterprise.dev', password: 'Manager@12345' },
  { label: 'Viewer', email: 'viewer@enterprise.dev', password: 'Viewer@12345' },
] as const;

export function LoginPage() {
  const { status, login, sessionNotice, clearSessionNotice } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const destination = (location.state as LocationState | null)?.from?.pathname || '/dashboard';

  if (status === 'authenticated') {
    return <Navigate to={destination} replace />;
  }

  function validateForm(): string | null {
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      return 'Please enter a valid work email address.';
    }
    if (password.length < 6) {
      return 'Password must be at least 6 characters.';
    }
    return null;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearSessionNotice();

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await login(email.trim(), password);
      navigate(destination, { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to sign in. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  function applyDemoAccount(demoEmail: string, demoPassword: string) {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError(null);
    clearSessionNotice();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8">
      <section
        className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8"
        aria-labelledby="login-heading"
      >
        <header className="mb-6">
          <p className="text-xs font-bold tracking-wider text-blue-700 uppercase">
            Enterprise Admin
          </p>
          <h1 id="login-heading" className="mt-1 text-2xl font-bold text-slate-900">
            Sign in to your account
          </h1>
          <p className="mt-1.5 text-sm text-slate-600">
            Access administration controls, audit records, and workspace metrics.
          </p>
        </header>

        {sessionNotice ? (
          <div
            className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-sm text-amber-900"
            role="status"
          >
            {sessionNotice}
          </div>
        ) : null}

        {error ? (
          <div
            className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-800"
            role="alert"
          >
            {error}
          </div>
        ) : null}

        <form className="space-y-4" onSubmit={(e) => void handleSubmit(e)} noValidate>
          <div>
            <label htmlFor="login-email" className="block text-sm font-medium text-slate-800">
              Work email
            </label>
            <input
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="name@enterprise.dev"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
              required
              className="mt-1.5 block w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 focus:outline-none disabled:bg-slate-100"
            />
          </div>

          <div>
            <label htmlFor="login-password" className="block text-sm font-medium text-slate-800">
              Password
            </label>
            <div className="relative mt-1.5">
              <input
                id="login-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={submitting}
                required
                className="block w-full rounded-lg border border-slate-300 bg-white py-2.5 pr-16 pl-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 focus:outline-none disabled:bg-slate-100"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-2 my-auto cursor-pointer px-2 text-xs font-semibold text-blue-700 hover:text-blue-800"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full cursor-pointer rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800 focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="mt-6 border-t border-slate-200 pt-4" aria-label="Demo accounts">
          <p className="text-xs font-semibold text-slate-500">Quick demo accounts</p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {DEMO_ACCOUNTS.map((account) => (
              <button
                key={account.label}
                type="button"
                className="cursor-pointer rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                onClick={() => applyDemoAccount(account.email, account.password)}
                disabled={submitting}
              >
                {account.label}
              </button>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
