import { Navigate } from 'react-router-dom';
import { AlertCircle, Eye, EyeOff, Info, Lock, ShieldCheck, User } from 'lucide-react';
import { BUTTON_TOKENS } from '../../theme/tokens';
import { useLoginForm } from '../../hooks/useLoginForm';

export function LoginPage() {
  const {
    email,
    setEmail,
    password,
    setPassword,
    showPassword,
    toggleShowPassword,
    submitting,
    error,
    sessionNotice,
    redirectTarget,
    quickAccounts,
    applyQuickAccount,
    handleSubmit,
  } = useLoginForm();

  if (redirectTarget) {
    return <Navigate to={redirectTarget} replace />;
  }

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-[#F5F7FA] px-4 py-8 text-slate-900 [--brand-primary-hover:#075985] [--brand-primary:#0369a1]">
      <form
        className="flex w-full max-w-[380px] flex-col items-center"
        onSubmit={(e) => void handleSubmit(e)}
        noValidate
        aria-label="Enterprise access sign in"
      >
        <ShieldCheck
          className="mb-3 h-14 w-14 text-primary"
          strokeWidth={1.5}
          aria-hidden="true"
        />

        <h1 className="mb-7 text-center text-2xl font-bold tracking-[0.2em] text-slate-900 uppercase">
          Enterprise Access
        </h1>

        {sessionNotice ? (
          <div
            className="mb-4 flex w-full items-start gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2.5 text-xs font-medium text-amber-900"
            role="status"
          >
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" aria-hidden="true" />
            <span>{sessionNotice}</span>
          </div>
        ) : null}

        {error ? (
          <div
            className="mb-4 flex w-full items-start gap-2 rounded-md border border-rose-300 bg-rose-50 px-3 py-2.5 text-xs font-medium text-rose-800"
            role="alert"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" aria-hidden="true" />
            <span>{error}</span>
          </div>
        ) : null}

        <div className="relative mb-3.5 w-full">
          <label htmlFor="login-email" className="sr-only">
            Work email
          </label>
          <User
            className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-primary"
            strokeWidth={1.6}
            aria-hidden="true"
          />
          <input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="WORK EMAIL"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={submitting}
            required
            className="h-11 w-full rounded-md border border-[#788BA2] bg-white/60 pr-3.5 pl-10 text-xs font-medium text-slate-900 placeholder:text-xs placeholder:font-normal placeholder:tracking-wider placeholder:text-slate-600 placeholder:opacity-100 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15 focus:outline-none disabled:opacity-60"
          />
        </div>

        <div className="relative mb-4 w-full">
          <label htmlFor="login-password" className="sr-only">
            Password
          </label>
          <Lock
            className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-primary"
            strokeWidth={1.6}
            aria-hidden="true"
          />
          <input
            id="login-password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="PASSWORD"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={submitting}
            required
            className="h-11 w-full rounded-md border border-[#788BA2] bg-white/60 pr-10 pl-10 text-xs font-medium text-slate-900 placeholder:text-xs placeholder:font-normal placeholder:tracking-wider placeholder:text-slate-600 placeholder:opacity-100 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15 focus:outline-none disabled:opacity-60"
          />
          <button
            type="button"
            className="absolute inset-y-0 right-2 my-auto flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-slate-600 transition hover:text-primary"
            onClick={toggleShowPassword}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className={`h-11 w-full ${BUTTON_TOKENS.primarySolid}`}
        >
          {submitting ? 'SIGNING IN...' : 'LOGIN'}
        </button>

        {quickAccounts.length > 0 ? (
          <div
            className="mt-6 w-full border-t border-slate-300/75 pt-5"
            aria-label="Quick role accounts"
          >
            <p className="mb-3 text-center text-[10px] font-semibold tracking-[0.16em] text-slate-600 uppercase">
              Quick fill demo accounts
            </p>
            <div className="grid w-full grid-cols-1 gap-2.5 sm:grid-cols-3">
              {quickAccounts.map((account) => (
                <button
                  key={account.role}
                  type="button"
                  className="flex cursor-pointer flex-col items-center justify-center rounded-md border border-[#94A3B8] bg-white/80 px-2.5 py-2.5 text-center transition hover:border-primary hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={() => applyQuickAccount(account)}
                  disabled={submitting}
                >
                  <span className="text-xs font-semibold text-slate-900">{account.label}</span>
                  <span className="mt-0.5 text-[10px] text-slate-600">{account.roleHint}</span>
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </form>
    </main>
  );
}
