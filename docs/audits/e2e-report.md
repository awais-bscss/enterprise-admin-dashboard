# End-to-End (E2E) Test Report

Summary of Playwright browser tests verifying authentication, role permissions, workspace CRUD flows, accessibility, and basic page-load vitals.

## How E2E Tests Run

- **Config:** `apps/frontend/playwright.config.ts`
- **Target Server:** `npm run preview -- --host 127.0.0.1 --port 4173 --strictPort` (tests the real production Vite build)
- **API Stub:** `apps/frontend/e2e/mockBackend.ts` intercepts `/api/*` requests in the browser so tests run reliably offline
- **Command:** `npm run test:e2e`

## Latest Run Summary

- **Browser:** Desktop Chrome (Playwright Chromium)
- **Result:** **3 passed / 3 total** (`43.7s`)

### Test 1: Auth, Projects & RBAC Flow (`auth-projects-rbac.spec.ts`)
1. Visiting `/audit` while signed out redirects to `/login`.
2. Entering a wrong password shows the `Invalid email or password` alert.
3. Signing in as `admin` returns to the requested `/audit` page (`Security Audit Logs`).
4. Navigating to `/dashboard` and `/projects`, opening **New Project**, and creating `"Zero Trust Policy Rollout"` updates the list and shows a success toast.
5. Clicking **Logout** returns to `/login`.
6. Signing in as `viewer` lands on `/dashboard`, displays 2 restricted nav badges, blocks `/audit` by redirecting to `/unauthorized` (`Access Restricted`), and hides the `New Project` button on `/projects`.

### Test 2: Accessibility Audit (`accessibility-performance.spec.ts`)
- Runs Axe (`wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`) on `/login` and across `/dashboard`, `/projects`, `/departments`, `/clients`, `/employees`, `/audit`, `/reports` in dark mode with zero violations.

### Test 3: Core Web Vitals & Lazy Chunks (`accessibility-performance.spec.ts`)
- Verifies `/login` keeps CLS under `0.1`, LCP under `2500ms`, and does **not** download `DashboardPage` before login.
- Verifies `/dashboard` loads `DashboardPage` lazily and keeps DOM nodes under `1500` (`484` measured) and CLS under `0.1` (`0.004` measured).
