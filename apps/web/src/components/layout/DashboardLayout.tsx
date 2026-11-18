import { lazy, Suspense, useState, type ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Activity,
  Briefcase,
  Building2,
  ChevronRight,
  FileSpreadsheet,
  FolderKanban,
  LayoutDashboard,
  Lock,
  LogOut,
  Menu,
  Monitor,
  Moon,
  ShieldCheck,
  Sun,
  Users,
  X,
} from 'lucide-react';
import { AppDropdown, type DropdownOption } from '../AppDropdown';
import { preloadRoute } from '../../app/routePreload';
import { useAuth } from '../../features/auth/authContext';
import { getInitials } from '../../lib/formatters';
import { type ThemeMode, useTheme } from '../../theme/themeContext';
import { BUTTON_TOKENS, SURFACE_TOKENS } from '../../theme/tokens';
import type { Permission } from '../../types/auth';

const THEME_OPTIONS: readonly DropdownOption<ThemeMode>[] = [
  { value: 'system', label: 'System', icon: Monitor },
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
];

const ProfileModal = lazy(() =>
  import('../../features/auth/ProfileModal').then((mod) => ({
    default: mod.ProfileModal,
  })),
);

interface NavItemConfig {
  label: string;
  to: string;
  icon: typeof LayoutDashboard;
  permission?: Permission;
}

interface NavSectionConfig {
  heading: string;
  items: readonly NavItemConfig[];
}

const NAV_SECTIONS: readonly NavSectionConfig[] = [
  {
    heading: 'Workspace',
    items: [{ label: 'Overview', to: '/dashboard', icon: LayoutDashboard }],
  },
  {
    heading: 'Operations',
    items: [
      { label: 'Projects', to: '/projects', icon: FolderKanban, permission: 'projects:read' },
      { label: 'Departments', to: '/departments', icon: Building2, permission: 'departments:read' },
      { label: 'Clients', to: '/clients', icon: Briefcase, permission: 'clients:read' },
    ],
  },
  {
    heading: 'Administration',
    items: [
      { label: 'Employees', to: '/employees', icon: Users, permission: 'users:read' },
      { label: 'Audit Logs', to: '/audit', icon: Activity, permission: 'audit:read' },
      { label: 'Reports', to: '/reports', icon: FileSpreadsheet, permission: 'reports:export' },
    ],
  },
];

function resolveActiveRoute(pathname: string) {
  for (const section of NAV_SECTIONS) {
    const match = section.items.find(
      (item) => pathname === item.to || pathname.startsWith(`${item.to}/`),
    );
    if (match) {
      return { section: section.heading, item: match };
    }
  }
  return null;
}

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout, hasPermission } = useAuth();
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const initials = getInitials(user?.name);
  const activeRoute = resolveActiveRoute(location.pathname);

  async function handleLogout() {
    setSigningOut(true);
    try {
      await logout();
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <div className={`flex min-h-screen w-full ${SURFACE_TOKENS.canvas}`}>
      {sidebarOpen ? (
        <button
          type="button"
          aria-label="Close sidebar overlay"
          className="fixed inset-0 z-30 bg-slate-900/20 backdrop-blur-[1px] lg:hidden dark:bg-slate-950/60"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 flex-col justify-between overflow-y-auto border-r border-slate-200/70 bg-surface p-5 transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 lg:shadow-sidebar dark:border-slate-800 ${
          sidebarOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full'
        }`}
        aria-label="Primary Sidebar"
      >
        <div className="space-y-6">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-sky-100 via-emerald-50 to-rose-100 text-slate-800 ring-1 ring-slate-200/70 dark:from-sky-500/25 dark:via-emerald-500/15 dark:to-rose-500/20 dark:text-sky-200 dark:ring-slate-700">
                <ShieldCheck className="h-5 w-5 text-sky-700 dark:text-sky-300" />
              </div>
              <div>
                <p className="text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  PMS
                </p>
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  Enterprise Dashboard
                </p>
              </div>
            </div>
            <button
              type="button"
              aria-label="Close navigation menu"
              className="rounded-full p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden dark:text-slate-400 dark:hover:bg-slate-800"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <nav className="space-y-5" aria-label="Workspace modules">
            {NAV_SECTIONS.map((section) => (
              <div key={section.heading} className="space-y-1">
                <p className="px-3 pb-1 text-[11px] font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                  {section.heading}
                </p>
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const allowed = !item.permission || hasPermission(item.permission);
                  const isActive = location.pathname === item.to;

                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onMouseEnter={() => preloadRoute(item.to)}
                      onFocus={() => preloadRoute(item.to)}
                      onClick={() => setSidebarOpen(false)}
                      className={`group flex items-center justify-between rounded-2xl px-3 py-2 text-sm font-medium outline-none transition focus-visible:ring-2 focus-visible:ring-sky-300 ${
                        isActive
                          ? 'bg-sky-100/80 text-sky-900 dark:bg-sky-500/20 dark:text-sky-100'
                          : allowed
                            ? 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/80 dark:hover:text-slate-100'
                            : 'text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <span
                          className={`flex h-6 w-6 items-center justify-center rounded-xl transition ${
                            isActive
                              ? 'text-sky-900 dark:text-sky-200'
                              : 'text-slate-500 group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-slate-200'
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                        </span>
                        <span>{item.label}</span>
                      </span>

                      {!allowed ? (
                        <Lock
                          className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600"
                          aria-label="Restricted for current role"
                        />
                      ) : isActive ? (
                        <ChevronRight className="h-4 w-4 text-sky-600 dark:text-sky-300" />
                      ) : null}
                    </NavLink>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>

        <div className="pt-4">
          <button
            type="button"
            onClick={() => void handleLogout()}
            disabled={signingOut}
            className="group flex w-full cursor-pointer items-center gap-2.5 rounded-2xl px-3 py-2 text-sm font-medium text-slate-600 outline-none transition hover:bg-rose-50/80 hover:text-rose-600 focus-visible:ring-2 focus-visible:ring-rose-200 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-300 dark:hover:bg-rose-500/15 dark:hover:text-rose-300"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-xl text-slate-500 transition group-hover:text-rose-600 dark:text-slate-400 dark:group-hover:text-rose-300">
              <LogOut className="h-4 w-4" aria-hidden="true" />
            </span>
            <span>{signingOut ? 'Logging out...' : 'Logout'}</span>
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col bg-canvas">
        <header className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/70 bg-surface/90 px-4 py-3.5 backdrop-blur-md sm:px-7 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Open navigation menu"
              className={`${BUTTON_TOKENS.iconCircle} lg:hidden`}
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>

            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm">
              {activeRoute ? (
                <>
                  <span className="hidden font-medium text-slate-500 sm:inline dark:text-slate-400">
                    {activeRoute.section}
                  </span>
                  <ChevronRight
                    className="hidden h-3.5 w-3.5 text-slate-300 sm:inline dark:text-slate-600"
                    aria-hidden="true"
                  />
                  <span className="font-semibold text-slate-800 dark:text-slate-100">
                    {activeRoute.item.label}
                  </span>
                </>
              ) : (
                <span className="font-medium text-slate-500 dark:text-slate-400">
                  {location.pathname}
                </span>
              )}
            </nav>
          </div>

          <div className="relative flex items-center gap-2.5">
            <AppDropdown<ThemeMode>
              variant="icon"
              align="right"
              direction="down"
              value={theme}
              options={THEME_OPTIONS}
              onChange={setTheme}
              ariaLabel="Theme mode"
              triggerIcon={theme === 'system' ? Monitor : theme === 'dark' ? Moon : Sun}
            />

            <button
              type="button"
              onClick={() => setProfileOpen(true)}
              title="Manage profile & password"
              className="flex cursor-pointer items-center gap-2.5 rounded-full border border-slate-200/80 bg-white p-1 transition hover:border-sky-200 hover:bg-sky-50/40 sm:py-1 sm:pr-3 sm:pl-1.5 dark:border-slate-700 dark:bg-slate-800/90 dark:hover:border-sky-500/40 dark:hover:bg-slate-800"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-sky-100 to-rose-100 text-[11px] font-bold text-slate-800 dark:from-sky-500/30 dark:to-rose-500/30 dark:text-slate-100">
                {initials}
              </div>
              <div className="hidden text-left leading-tight sm:block">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-100">
                  {user?.name}
                </p>
                <p className="text-[10px] font-medium text-slate-500 capitalize dark:text-slate-400">
                  {user?.role}
                </p>
              </div>
              <span className="sr-only">Open profile and password settings</span>
            </button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1440px] flex-1 p-4 sm:p-7">{children}</main>
      </div>

      {profileOpen ? (
        <Suspense fallback={null}>
          <ProfileModal onClose={() => setProfileOpen(false)} />
        </Suspense>
      ) : null}
    </div>
  );
}
