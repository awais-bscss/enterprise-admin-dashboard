# Test Strategy & Coverage Summary

A plain-English guide to how this project is tested, what each test layer covers, and how to run every check.

## Overview of Automated Tests (63 Total)

| Layer | Location | Tool | Count | What It Checks |
| --- | --- | --- | --- | --- |
| Backend Unit | `apps/backend/tests/` | Node `node --test` + `tsx` | **13 tests (3 files)** | RBAC permissions, password rules, regex escaping, project filtering/sorting, dashboard metric math |
| Frontend Unit | `apps/frontend/src/lib/`, `features/auth/`, `workers/` | Vitest | **20 tests (6 files)** | Route access checks, `api.ts` retry/refresh behavior, async cookies, date/name formatters, form validators, CSV/JSON export safety |
| Frontend Integration | `apps/frontend/src/features/` | Vitest + React Testing Library + MSW | **23 tests (5 files)** | Login flow, route guards, Dashboard cards/charts/retry, Projects filters/creation/URL sync, Departments/Clients/Employees drill-downs |
| Browser E2E & A11y | `apps/frontend/e2e/` | Playwright + `@axe-core/playwright` | **3 tests (2 files)** | Redirects, wrong-password alert, project creation, logout, viewer RBAC blocks, WCAG 2.1 AA checks across routes, Core Web Vitals & lazy chunks |
| Standalone Exercise | `exercises/structured-output-adapter/` | Node `node --test` | **4 tests (1 file)** | Runtime validation, fallback handling, and memoized selector behavior |

## Running All Checks

```bash
# Backend checks & unit tests
npm run typecheck:backend
npm run compile:backend
npm run test:backend

# Frontend quality, build & tests
npm run lint:frontend
npm --prefix apps/frontend run typecheck:tests
npm run test:frontend
npm run build:frontend
npm run test:e2e

# Exercise tests
npm run test:exercise
```

## Detailed Coverage Notes

### Backend Unit Tests (`apps/backend/tests/`)
- `dashboardHelpers.test.ts` (`4` tests): deadline urgency (`critical`/`warning`/`upcoming`), active department weighted progress, employee & project status totals, overview payload formatting.
- `projectHelpers.test.ts` (`5` tests): progress clamping (`100` when completed), team deduplication, safe filters ignoring invalid MongoDB ObjectIds, sorting deadlines with null due dates last, Zod validation.
- `securityAndUserHelpers.test.ts` (`4` tests): role permissions immutability, strong password rules (`8+` chars with upper/lower/digit), `escapeRegex()`, user serialization and stats.

### Frontend Tests (`apps/frontend/`)
- **Unit (`20` tests):** `routePermissions.test.ts` (`5`), `api.test.ts` (`5`), `formatters.test.ts` (`4`), `cookies.test.ts` (`2`), `validation.test.ts` (`2`), `reportSerializer.test.ts` (`2`).
- **Integration (`23` tests):** `LoginPage.integration.test.tsx` (`5`), `ProtectedRoute.test.tsx` (`5`), `DashboardPage.integration.test.tsx` (`4`), `WorkspaceDirectories.integration.test.tsx` (`3`), `ProjectsPage.integration.test.tsx` (`6`).
- All integration tests use MSW (`apps/frontend/src/test/mswServer.ts`) to simulate API responses without a real database.

## Honest Boundaries (What Is Mocked vs Live)

- Frontend integration tests use MSW, and Playwright E2E tests use `apps/frontend/e2e/mockBackend.ts` against `npm run preview`. They do not spin up MongoDB during test runs.
- Full end-to-end persistence against a live MongoDB database is covered when running the full app locally (`npm run seed:backend` + `npm run dev`) or in the deployed environment.
