# Frontend Test Strategy — Enterprise Admin Portal

**Scope:** `apps/web` (React 19 + TypeScript + Vite 8 SPA)  
**Test Stack:** Vitest (`5.1.0`), React Testing Library (`16.3.3`), User Event (`14.6.12`), MSW (`3.0.6`), Playwright (`1.65.1`)  
**Related Report:** [Security Review](security-review.md)

---

## 1. Objectives & Testing Philosophy

The Enterprise Admin Portal relies on in-memory JWT sessions, transparent single-flight token refreshes, granular RBAC route/UI gates, and paginated TanStack Query workflows. Our test strategy prioritizes **behavioral confidence at real boundaries** over shallow snapshot or implementation-detail coupling:

1. **Test user-visible behavior:** Queries use semantic ARIA roles, labels, and headings (`getByRole`, `getByLabelText`, `findAllByRole`) so refactors that preserve UX keep passing.
2. **Mock at the HTTP transport boundary:** Integration tests run against real Axios interceptors, real `QueryClient`, and real React Router transitions while intercepting network traffic cleanly via `msw/node` (`onUnhandledFrame: 'error'`).
3. **Eliminate cross-test state leakage:** Shared state (`csrf_token` cookies, `localStorage`, in-memory `accessToken`, `sessionExpiredHandler`, TanStack `QueryClient` cache, and dark theme class) resets automatically after every test in [`apps/web/src/test/setup.ts`](../../apps/web/src/test/setup.ts).
4. **Keep production and test type scopes separate:** [`apps/web/tsconfig.test.json`](../../apps/web/tsconfig.test.json) validates Vitest, Testing Library, and Playwright files strictly while excluding test files from [`apps/web/tsconfig.app.json`](../../apps/web/tsconfig.app.json) production bundles.

---

## 2. Testing Pyramid & Layer Responsibilities

| Layer | Runner & Libraries | Scope & Rationale | Implemented Suites |
| --- | --- | --- | --- |
| **1. Unit Tests** | Vitest (`jsdom` / Node) | Pure business rules, edge boundaries, input validators, CSV formula-injection neutralization, and cross-role post-login destination calculation. Fast, deterministic, zero DOM overhead. | [`routePermissions.test.ts`](../../apps/web/src/features/auth/routePermissions.test.ts) (`5` tests), [`reportSerializer.test.ts`](../../apps/web/src/workers/reportSerializer.test.ts) (`2` tests), [`validation.test.ts`](../../apps/web/src/lib/validation.test.ts) (`2` tests) |
| **2. API & Interceptor Integration** | Vitest + Axios + `msw/node` | Verifies request/response interceptor logic under realistic HTTP responses: Bearer injection, `skipAuth`, `withCsrf`, `cleanParams`, concurrent `401` single-flight refresh coalescing, single-notification expired refresh (`onSessionExpired`), transient `GET` `503` retry vs non-retryable `POST` writes, and `AbortController` cancellation. | [`api.test.ts`](../../apps/web/src/lib/api.test.ts) (`5` tests) |
| **3. Component & Feature Integration** | Vitest + React Testing Library + `user-event` + MSW | Tests mounted providers (`ThemeProvider`, `QueryClientProvider`, `ToastProvider`, `MemoryRouter`, `AuthProvider`), route guards, form validation, API error banners, retry recovery, URL query param hydration, loading skeletons, modal CRUD + batch import validation, status/track filtering, and pagination parameter propagation. | [`ProtectedRoute.test.tsx`](../../apps/web/src/features/auth/ProtectedRoute.test.tsx) (`5` tests), [`LoginPage.integration.test.tsx`](../../apps/web/src/features/auth/LoginPage.integration.test.tsx) (`5` tests), [`ProjectsPage.integration.test.tsx`](../../apps/web/src/features/projects/ProjectsPage.integration.test.tsx) (`5` tests), [`useProjectImport.test.ts`](../../apps/web/src/hooks/useProjectImport.test.ts) (`3` tests) |
| **4. End-to-End (E2E) Browser** | Playwright Chromium (`vite preview`) | Exercises the compiled production bundle (`dist/`) inside headless Chromium at `http://127.0.0.1:4173` across multi-page navigation, full cookie lifecycle, modal submission, logout, WCAG 2.1 AA Axe scans, CWV checks, and cross-role RBAC enforcement. | [`auth-projects-rbac.spec.ts`](../../apps/web/e2e/auth-projects-rbac.spec.ts), [`accessibility-performance.spec.ts`](../../apps/web/e2e/accessibility-performance.spec.ts) (`3` specs) |

---

## 3. Mocking Boundaries & Async Determinism

### 3.1 HTTP Network Interception (`msw/node` v3)

- Centralized default handlers in [`mswServer.ts`](../../apps/web/src/test/mswServer.ts) mirror backend `{ ok: true, data }` and `{ ok: false, error: { code, message } }` contracts.
- `server.listen({ onUnhandledFrame: 'error' })` ensures any accidental unmocked API call fails the test immediately rather than hanging or hitting local ports.
- Individual integration tests override endpoints with `server.use(...)` to assert query parameters, simulate concurrency races (`401` refresh coalescing), and trigger controlled `400`/`503` error recovery paths.

### 3.2 Async Teardown Isolation

- Dynamic route prefetching ([`routePreload.ts`](../../apps/web/src/app/routePreload.ts)) is mocked cleanly in [`setup.ts`](../../apps/web/src/test/setup.ts) so fire-and-forget `import()` calls for unrelated dashboard/chart bundles do not continue resolving after JSDOM teardown (`EnvironmentTeardownError`).
- Integration tests use explicit async UI assertions (`findByRole`, `findByText`, `findAllByRole`) instead of arbitrary `sleep` timers; `testTimeout` is configured at `15_000ms` in [`vitest.config.ts`](../../apps/web/vitest.config.ts) to accommodate `user-event` keystroke typing during cold JSDOM startups.

### 3.3 Playwright Browser Network & Cookie Fidelity

- [`playwright.config.ts`](../../apps/web/playwright.config.ts) launches Chromium against the built `vite preview` server (`127.0.0.1:4173`).
- `e2e/auth-projects-rbac.spec.ts` installs stateful `page.route('**/api/**', ...)` handlers paired with `context.addCookies(...)` on `/login` and `context.clearCookies()` on `/logout`, guaranteeing full `AuthProvider` session restoration across full browser page reloads (`page.goto('/settings')`) without requiring a live MongoDB instance in CI.

---

## 4. Verified Suite Results & Measured Coverage

Observed test execution after final updates:

- **Vitest (`npm run test:web`):** `8` test files passed, `32` tests passed, `0` failed, `0` unhandled errors.
- **Playwright (`npm run test:e2e`):** `3` E2E & accessibility/CWV specs passed in Chromium against production build (`dist/`).
- **Test TypeScript check (`npm --prefix apps/web run typecheck:tests`):** `0` errors.
- **Lint (`npm run lint:web` / `oxlint` across `80` files):** `0` warnings, `0` errors.

### Measured V8 Coverage Snapshot (`vitest run --coverage`)

| Module / Area | Statements | Branches | Functions | Lines | Notes |
| --- | --- | --- | --- | --- | --- |
| **Overall (`apps/web/src`)** | `39.68%` | `38.19%` | `29.45%` | `40.79%` | Focused on Auth, RBAC, API layer, Serialization, Validation, and Projects |
| `lib/api.ts` | `84.21%` | `76.84%` | `72.72%` | `85.18%` | Core request/response interceptors, retry, and single-flight refresh |
| `lib/validation.ts` & `lib/errors.ts` | `100%` | `100%` / `50%` | `100%` | `100%` | Input rules and normalized error extraction |
| `workers/reportSerializer.ts` | `100%` | `100%` | `100%` | `100%` | JSON formatting and CSV formula-injection neutralization |
| `features/auth/routePermissions.ts` & `PermissionGate.tsx` | `100%` | `100%` | `100%` | `100%` | Path permission rules and UI action gating |
| `features/auth/LoginPage.tsx` & `hooks/useLoginForm.ts` | `100%` / `93.93%` | `65%` / `100%` | `100%` / `66.66%` | `100%` / `96.87%` | Form validation, server error handling, cross-role redirect |
| `features/auth/ProtectedRoute.tsx` | `90.9%` | `76.92%` | `100%` | `90.9%` | Loading, auth redirect, and permission restriction |
| `hooks/useProjectForm.ts` & `ProjectsPage.tsx` | `88.23%` / `68.18%` | `78.57%` / `93.75%` | `71.42%` / `61.53%` | `88.23%` / `68.18%` | Filtering, pagination, modal creation, error retry, and RBAC read-only view |

---

## 5. Running Tests Locally & in CI

From repository root ([`package.json`](../../package.json)):

```bash
# Run unit and RTL + MSW integration suite
npm run test:web

# Run Vitest with V8 coverage report
npm --prefix apps/web run test:coverage

# Typecheck unit, integration, and E2E test suites
npm --prefix apps/web run typecheck:tests

# Build frontend bundle and run Playwright E2E suite
npm run build:web
npm run test:e2e
```

---

## 6. Known Coverage Gaps & Next Expansion Targets

- **Feature pages not yet covered by dedicated integration specs:** `DashboardPage`, `DirectoryPage` (user role/suspension workflows), `AuditLogsPage`, `ReportsPage`, `SettingsPage`, `ProfileModal`, and `ErrorBoundary` currently have `0%` direct Vitest statement coverage (note that `DashboardPage` overview navigation and `SettingsPage` rendering are verified via Playwright E2E).
- **Browser Web Worker transport (`lib/workerClient.ts` & `workers/workspace.worker.ts`):** Pure serialization rules are `100%` covered via `reportSerializer.test.ts`; Worker message post/response timeout handling in `workerClient.ts` remains uncovered in JSDOM.
- **Backend integration & live-stack E2E:** Express/Mongoose integration tests for `apps/api` and Playwright runs wired directly to a seeded ephemeral backend database can extend coverage beyond mocked HTTP fixtures.
- **Performance, accessibility, and bundle verification:** Automated Lighthouse, axe/WCAG accessibility, Core Web Vitals, and bundle composition checks are tracked separately under `docs/audits/`.
