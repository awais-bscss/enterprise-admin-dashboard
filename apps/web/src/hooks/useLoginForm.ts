import { useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { preloadRoute } from '../app/routePreload';
import { useToast } from '../components/toast/toastContext';
import { getErrorMessage } from '../lib/errors';
import { validateEmail, validatePasswordMin } from '../lib/validation';
import { useAuth } from '../features/auth/authContext';
import { resolveLoginDestination } from '../features/auth/routePermissions';

interface LocationState {
  from?: {
    pathname?: string;
  };
}

export interface DevQuickAccount {
  role: 'admin' | 'manager' | 'viewer';
  label: string;
  roleHint: string;
  email: string;
  password: string;
}

function getDevQuickAccounts(): DevQuickAccount[] {
  if (!import.meta.env.DEV) return [];

  const definitions: Array<{
    role: DevQuickAccount['role'];
    label: string;
    roleHint: string;
    email?: string;
    password?: string;
  }> = [
    {
      role: 'admin',
      label: 'Admin',
      roleHint: 'Full access',
      email: import.meta.env.VITE_DEV_ADMIN_EMAIL,
      password: import.meta.env.VITE_DEV_ADMIN_PASSWORD,
    },
    {
      role: 'manager',
      label: 'Manager',
      roleHint: 'Audit & export',
      email: import.meta.env.VITE_DEV_MANAGER_EMAIL,
      password: import.meta.env.VITE_DEV_MANAGER_PASSWORD,
    },
    {
      role: 'viewer',
      label: 'Viewer',
      roleHint: 'Read only',
      email: import.meta.env.VITE_DEV_VIEWER_EMAIL,
      password: import.meta.env.VITE_DEV_VIEWER_PASSWORD,
    },
  ];

  return definitions
    .filter((entry) => Boolean(entry.email?.trim() && entry.password))
    .map((entry) => ({
      role: entry.role,
      label: entry.label,
      roleHint: entry.roleHint,
      email: entry.email!.trim(),
      password: entry.password!,
    }));
}

export function useLoginForm() {
  const { user, status, login, sessionNotice, clearSessionNotice } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const quickAccounts = getDevQuickAccounts();
  const requestedPath = (location.state as LocationState | null)?.from?.pathname;
  const redirectTarget =
    status === 'authenticated' ? resolveLoginDestination(user, requestedPath) : null;

  function validateForm(): string | null {
    return (
      validateEmail(email) ??
      validatePasswordMin(password, 6, 'Password must be at least 6 characters.')
    );
  }

  function applyQuickAccount(account: DevQuickAccount) {
    setEmail(account.email);
    setPassword(account.password);
    setError(null);
    clearSessionNotice();
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
      const authenticatedUser = await login(email.trim(), password);
      const destination = resolveLoginDestination(authenticatedUser, requestedPath);
      preloadRoute(destination);
      toast.success(`Signed in as ${authenticatedUser.name}.`);
      navigate(destination, { replace: true });
    } catch (err) {
      const message = getErrorMessage(err, 'Unable to sign in. Please try again.');
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return {
    email,
    setEmail,
    password,
    setPassword,
    showPassword,
    toggleShowPassword: () => setShowPassword((prev) => !prev),
    submitting,
    error,
    sessionNotice,
    redirectTarget,
    quickAccounts,
    applyQuickAccount,
    handleSubmit,
  };
}
