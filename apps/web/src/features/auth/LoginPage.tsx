import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import {
  Activity,
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Info,
  KeyRound,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import { getErrorMessage } from '../../lib/errors';
import { validateEmail, validatePasswordMin } from '../../lib/validation';
import { useAuth } from './authContext';

const SHOW_DEMO_ROLES = import.meta.env.VITE_HIDE_DEMO_ROLES !== 'true';

interface LocationState {
  from?: {
    pathname?: string;
  };
}

const DEMO_ACCOUNTS = [
  {
    label: 'Admin',
    roleHint: 'Full access',
    email: 'admin@enterprise.dev',
    password: 'Admin@12345',
    pillClass: 'border-emerald-200/80 bg-emerald-50/75 text-emerald-800 hover:bg-emerald-100/70',
    icon: ShieldCheck,
  },
  {
    label: 'Manager',
    roleHint: 'Audit & export',
    email: 'manager@enterprise.dev',
    password: 'Manager@12345',
    pillClass: 'border-sky-200/80 bg-sky-50/75 text-sky-800 hover:bg-sky-100/70',
    icon: UserCheck,
  },
  {
    label: 'Viewer',
    roleHint: 'Read only',
    email: 'viewer@enterprise.dev',
    password: 'Viewer@12345',
    pillClass: 'border-rose-200/80 bg-rose-50/75 text-rose-800 hover:bg-rose-100/70',
    icon: Eye,
  },
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
    return (
      validateEmail(email) ??
      validatePasswordMin(password, 6, 'Password must be at least 6 characters.')
    );
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
      setError(getErrorMessage(err, 'Unable to sign in. Please try again.'));
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
    <main className="grid min-h-screen w-full bg-[#f5f7fa] text-slate-900 lg:grid-cols-12">
      {/* Left Light Workspace Showcase (Desktop) */}
      <aside className="hidden flex-col justify-between border-r border-slate-200/75 bg-white p-10 lg:col-span-5 lg:flex">
        <div className="space-y-8">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-100 via-emerald-50 to-rose-100 text-sky-700 ring-1 ring-slate-200/70">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold tracking-tight text-slate-900">Veridian</p>
              <p className="text-[11px] font-medium text-slate-500">Enterprise Admin</p>
            </div>
          </div>

          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-3 py-1 text-[11px] font-semibold text-sky-700 ring-1 ring-sky-200/70">
              <Sparkles className="h-3 w-3" />
              Role-Scoped Security
            </span>
            <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
              Clarity-first workspace governance.
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">
              Monitor organization accounts, inspect audit logs, and manage role permissions from
              one unified console.
            </p>
          </div>

          {/* Mini Light Chart Preview */}
          <div className="rounded-[24px] border border-slate-200/70 bg-[#f8fafc] p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-100/80 text-sky-700">
                  <Activity className="h-4 w-4" />
                </span>
                <span className="text-xs font-semibold text-slate-800">Session Health</span>
              </div>
              <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200/70">
                99.9% Healthy
              </span>
            </div>

            <div className="mt-3 h-24 w-full">
              <svg
                viewBox="0 0 260 72"
                className="h-full w-full overflow-visible"
                aria-hidden="true"
              >
                <defs>
                  <linearGradient id="loginSparkFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#93C5FD" stopOpacity="0.45" />
                    <stop offset="95%" stopColor="#93C5FD" stopOpacity="0.02" />
                  </linearGradient>
                </defs>
                <path
                  d="M0 54 C30 48, 42 28, 70 30 C98 32, 112 42, 138 22 C164 4, 186 26, 214 18 C232 13, 246 8, 260 6 L260 72 L0 72 Z"
                  fill="url(#loginSparkFill)"
                />
                <path
                  d="M0 54 C30 48, 42 28, 70 30 C98 32, 112 42, 138 22 C164 4, 186 26, 214 18 C232 13, 246 8, 260 6"
                  fill="none"
                  stroke="#60A5FA"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <circle cx="138" cy="22" r="4" fill="#3B82F6" stroke="#FFFFFF" strokeWidth="2" />
              </svg>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-5">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1 text-[11px] font-medium text-slate-600 ring-1 ring-slate-200/70">
            <KeyRound className="h-3 w-3 text-emerald-600" />
            JWT + Refresh Rotation
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1 text-[11px] font-medium text-slate-600 ring-1 ring-slate-200/70">
            <Lock className="h-3 w-3 text-rose-500" />
            CSRF Protected
          </span>
        </div>
      </aside>

      {/* Right Sign-In Form Area */}
      <div className="flex items-center justify-center p-4 sm:p-8 lg:col-span-7">
        <section
          className="bento-shadow w-full max-w-md rounded-[24px] border border-slate-200/75 bg-white p-6 sm:p-8"
          aria-labelledby="login-heading"
        >
          <div className="mb-5 flex items-center gap-2 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-100 via-emerald-50 to-rose-100 text-sky-700 ring-1 ring-slate-200/70">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <span className="text-sm font-bold text-slate-900">Veridian Admin</span>
          </div>
          <header className="mb-6">
            <p className="text-xs font-semibold tracking-wider text-sky-700 uppercase">
              Workspace Sign In
            </p>
            <h1 id="login-heading" className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900">
              Welcome back
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Sign in with your work credentials to continue to your dashboard.
            </p>
          </header>

          {sessionNotice ? (
            <div
              className="mb-4 flex items-start gap-2.5 rounded-2xl border border-amber-200/80 bg-amber-50/80 px-3.5 py-3 text-xs font-medium text-amber-900"
              role="status"
            >
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <span>{sessionNotice}</span>
            </div>
          ) : null}

          {error ? (
            <div
              className="mb-4 flex items-start gap-2.5 rounded-2xl border border-rose-200/80 bg-rose-50/80 px-3.5 py-3 text-xs font-medium text-rose-800"
              role="alert"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          ) : null}

          <form className="space-y-4" onSubmit={(e) => void handleSubmit(e)} noValidate>
            <div>
              <label htmlFor="login-email" className="block text-xs font-semibold text-slate-700">
                Work email
              </label>
              <div className="relative mt-1.5">
                <Mail className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
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
                  className="block w-full rounded-2xl border border-slate-200 bg-slate-50/60 py-2.5 pr-3.5 pl-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-300 focus:bg-white focus:ring-2 focus:ring-sky-100 focus:outline-none disabled:bg-slate-100"
                />
              </div>
            </div>

            <div>
              <label htmlFor="login-password" className="block text-xs font-semibold text-slate-700">
                Password
              </label>
              <div className="relative mt-1.5">
                <Lock className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
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
                  className="block w-full rounded-2xl border border-slate-200 bg-slate-50/60 py-2.5 pr-11 pl-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-300 focus:bg-white focus:ring-2 focus:ring-sky-100 focus:outline-none disabled:bg-slate-100"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-2.5 my-auto flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-sky-200/90 bg-sky-100/90 px-4 py-3 text-sm font-semibold text-sky-900 transition hover:bg-sky-200/80 focus:ring-2 focus:ring-sky-200 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span>{submitting ? 'Signing in...' : 'Sign in to Dashboard'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {SHOW_DEMO_ROLES ? (
            <div className="mt-6 border-t border-slate-100 pt-5" aria-label="Demo accounts">
              <p className="text-xs font-semibold text-slate-500">Quick demo roles</p>
              <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-3">
                {DEMO_ACCOUNTS.map((account) => {
                  const Icon = account.icon;
                  return (
                    <button
                      key={account.label}
                      type="button"
                      className={`flex cursor-pointer items-center gap-2 rounded-2xl border px-3 py-2 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${account.pillClass}`}
                      onClick={() => applyDemoAccount(account.email, account.password)}
                      disabled={submitting}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold leading-tight">{account.label}</p>
                        <p className="truncate text-[10px] opacity-80">{account.roleHint}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
