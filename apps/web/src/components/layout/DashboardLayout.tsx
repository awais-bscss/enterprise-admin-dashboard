import { useState, type ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Activity,
  Bell,
  ChevronRight,
  FileSpreadsheet,
  FolderKanban,
  LayoutDashboard,
  Lock,
  LogOut,
  Menu,
  Search,
  Settings,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';
import type { Permission } from '../../types/auth';
import { BADGE_TOKENS, SURFACE_TOKENS } from '../../theme/tokens';
import { useAuth } from '../../features/auth/authContext';
import { PermissionGate } from '../../features/auth/PermissionGate';
import { ProfileModal } from '../../features/auth/ProfileModal';

interface NavItemConfig {
  label: string;
  to: string;
  icon: typeof LayoutDashboard;
  permission?: Permission;
  badge?: string;
}

const NAV_ITEMS: readonly NavItemConfig[] = [
  { label: 'Overview', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Projects', to: '/projects', icon: FolderKanban, permission: 'projects:read' },
  { label: 'Users', to: '/users', icon: Users, permission: 'users:read' },
  { label: 'Audit Logs', to: '/audit', icon: Activity, permission: 'audit:read' },
  { label: 'Reports', to: '/reports', icon: FileSpreadsheet, permission: 'reports:export' },
  { label: 'Settings', to: '/settings', icon: Settings, permission: 'settings:manage' },
];

function getInitials(name: string | undefined): string {
  if (!name) return 'EA';
  const parts = name.trim().split(/\s+/);
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

interface DashboardLayoutProps {
  children: ReactNode;
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
}

export function DashboardLayout({
  children,
  searchQuery = '',
  onSearchChange,
}: DashboardLayoutProps) {
  const { user, expiresAt, logout, hasPermission } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const initials = getInitials(user?.name);
  const roleBadgeClass = user ? BADGE_TOKENS.role[user.role] : 'bg-slate-100 text-slate-700';

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
      {/* Mobile drawer backdrop */}
      {sidebarOpen ? (
        <button
          type="button"
          aria-label="Close sidebar overlay"
          className="fixed inset-0 z-30 bg-slate-900/15 backdrop-blur-[1px] lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}

      {/* Light Left Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 flex-col justify-between bg-white p-5 transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 lg:shadow-sidebar ${
          sidebarOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full'
        }`}
        aria-label="Primary Sidebar"
      >
          <div className="space-y-6">
            {/* Brand Header */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-100 via-emerald-50 to-rose-100 text-slate-800 ring-1 ring-slate-200/70">
                  <ShieldCheck className="h-5 w-5 text-sky-700" />
                </div>
                <div>
                  <p className="text-sm font-bold tracking-tight text-slate-900">Veridian</p>
                  <p className="text-[11px] font-medium text-slate-400">Enterprise Admin</p>
                </div>
              </div>
              <button
                type="button"
                aria-label="Close navigation menu"
                className="rounded-full p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="space-y-1.5" aria-label="Workspace modules">
              <p className="px-3 pb-1 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                Workspace
              </p>
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const allowed = !item.permission || hasPermission(item.permission);
                const isActive = location.pathname === item.to;

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setSidebarOpen(false)}
                    className={`group flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium outline-none transition focus-visible:ring-2 focus-visible:ring-sky-300 ${
                      isActive
                        ? 'bg-sky-100/80 text-sky-900'
                        : allowed
                          ? 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                          : 'text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-md transition ${
                          isActive
                            ? 'text-sky-900'
                            : 'text-slate-500 group-hover:text-slate-700'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span>{item.label}</span>
                    </span>

                    {!allowed ? (
                      <Lock
                        className="h-3.5 w-3.5 text-slate-300"
                        aria-label="Restricted for current role"
                      />
                    ) : isActive ? (
                      <ChevronRight className="h-4 w-4 text-sky-600" />
                    ) : null}
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* Sidebar Footer: Session + User Card */}
          <div className="space-y-3 border-t border-slate-100 pt-4">
            <div className="rounded-2xl bg-gradient-to-br from-emerald-50/80 via-sky-50/70 to-white p-3 ring-1 ring-slate-200/60">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  RBAC Active
                </span>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase ${roleBadgeClass}`}>
                  {user?.role}
                </span>
              </div>
              <p className="mt-1.5 text-[11px] text-slate-500">
                {user?.permissions.length ?? 0} of 7 workspace capabilities granted
              </p>
            </div>

            <div className="flex items-center justify-between gap-2 rounded-2xl border border-slate-200/70 bg-slate-50/70 p-2.5">
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-100 text-xs font-bold text-sky-800 ring-2 ring-white">
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-slate-900">{user?.name}</p>
                  <p className="truncate text-[11px] text-slate-500">{user?.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => void handleLogout()}
                disabled={signingOut}
                title="Sign out"
                aria-label="Sign out"
                className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-slate-200/80 bg-white text-slate-600 transition hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content Canvas */}
        <div className="flex min-w-0 flex-1 flex-col bg-canvas">
          {/* Light Top Header Bar */}
          <header className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/70 bg-white/90 px-4 py-3.5 backdrop-blur-md sm:px-7">
            <div className="flex items-center gap-3">
              <button
                type="button"
                aria-label="Open navigation menu"
                className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-slate-200/80 bg-white text-slate-600 hover:bg-slate-50 lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </button>

              {onSearchChange ? (
                <div className="relative hidden sm:block">
                  <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="Filter modules or permissions..."
                    aria-label="Filter modules or permissions"
                    className="h-10 w-64 rounded-full border border-slate-200/80 bg-slate-50/80 pr-4 pl-10 text-sm text-slate-800 placeholder:text-slate-400 focus:border-sky-300 focus:bg-white focus:ring-2 focus:ring-sky-100 focus:outline-none md:w-72"
                  />
                </div>
              ) : (
                <span className="text-sm font-medium text-slate-500">
                  Enterprise Administration Console
                </span>
              )}
            </div>

            <div className="relative flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setShowNotifications((prev) => !prev)}
                aria-label="Session notifications"
                className="relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-slate-200/80 bg-white text-slate-600 transition hover:bg-slate-50"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-white" />
              </button>

              <PermissionGate permission="settings:manage">
                <NavLink
                  to="/settings"
                  aria-label="System settings"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200/80 bg-white text-slate-600 transition hover:bg-slate-50"
                >
                  <Settings className="h-4 w-4" />
                </NavLink>
              </PermissionGate>

              <button
                type="button"
                onClick={() => setProfileOpen(true)}
                aria-label="Open profile and password settings"
                title="Manage profile & password"
                className="flex cursor-pointer items-center gap-2.5 rounded-full border border-slate-200/80 bg-white p-1 transition hover:border-sky-200 hover:bg-sky-50/40 sm:py-1 sm:pr-3 sm:pl-1.5"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-sky-100 to-rose-100 text-[11px] font-bold text-slate-800">
                  {initials}
                </div>
                <div className="hidden text-left leading-tight sm:block">
                  <p className="text-xs font-semibold text-slate-800">{user?.name}</p>
                  <p className="text-[10px] font-medium text-slate-400 capitalize">{user?.role}</p>
                </div>
              </button>

              {showNotifications ? (
                <div
                  className="bento-shadow absolute top-12 right-0 z-30 w-72 rounded-2xl border border-slate-200/80 bg-white p-4 text-xs"
                  role="dialog"
                  aria-label="Session status"
                >
                  <div className="flex items-center justify-between pb-2">
                    <span className="font-semibold text-slate-900">Active Security Session</span>
                    <button
                      type="button"
                      onClick={() => setShowNotifications(false)}
                      className="cursor-pointer text-slate-400 hover:text-slate-700"
                    >
                      Close
                    </button>
                  </div>
                  <p className="text-slate-600">
                    Signed in as <span className="font-medium text-slate-900">{user?.email}</span>.
                  </p>
                  {expiresAt ? (
                    <p className="mt-1.5 rounded-xl bg-sky-50/80 px-2.5 py-2 text-sky-800">
                      Silent token refresh scheduled before{' '}
                      <span className="font-semibold">
                        {new Date(expiresAt).toLocaleTimeString()}
                      </span>
                      .
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          </header>

          <main className="mx-auto w-full max-w-[1440px] flex-1 p-4 sm:p-7">{children}</main>
        </div>

      {profileOpen ? <ProfileModal onClose={() => setProfileOpen(false)} /> : null}
    </div>
  );
}
