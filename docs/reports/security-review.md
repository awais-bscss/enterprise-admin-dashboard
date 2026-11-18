# Security Overview

A practical summary of how login sessions, permissions, cookies, and API protection work in `apps/backend` and `apps/frontend`.

## 1. Authentication & Token Storage

- **Short-lived access token (15 minutes):** Stored only in frontend JavaScript memory (`apps/frontend/src/lib/api.ts`) and sent in the `Authorization: Bearer <token>` header. It is never stored in `localStorage` or `sessionStorage`, so XSS scripts cannot read it from web storage.
- **Long-lived refresh token (7 days):** Stored by the backend in an `httpOnly`, `sameSite: "lax"` cookie (`refresh_token`, cookie path `/api`, `secure: true` in production) and saved as a SHA-256 hash (`hashToken`) in MongoDB.
- **Concurrent `401` handling:** If multiple requests fail with `401` at the same time, `apps/frontend/src/lib/api.ts` sends only one `/api/auth/refresh` request (`sessionRefreshInFlight`) and retries waiting requests once refreshed.

Relevant files:
- Backend token helpers: `apps/backend/src/utils/tokens.ts`
- Frontend API client: `apps/frontend/src/lib/api.ts`

## 2. CSRF Protection

- Refresh (`/api/auth/refresh`) and logout (`/api/auth/logout`) rely on cookies, so both require the `requireCsrf` middleware (`apps/backend/src/middleware/csrf.ts`).
- When logging in or refreshing, the backend sets a signed `csrf_token` cookie (`HMAC-SHA256` signed with `CSRF_SECRET` or `JWT_REFRESH_SECRET`).
- On `/refresh` and `/logout`, the frontend reads `csrf_token` asynchronously (`apps/frontend/src/lib/cookies.ts`) and sends it back in the `x-csrf-token` header (`withCsrf: true`).
- The backend verifies the `Origin` header (when present), verifies the HMAC signature, and compares cookie vs header using `crypto.timingSafeEqual`.

## 3. Role-Based Access Control (RBAC)

Permissions are enforced on **both** the server and the UI:

- **Backend (`apps/backend/src/middleware/auth.ts` & `apps/backend/src/config/rbac.ts`):**
  - Every protected route runs `requireAuth`, verifies the JWT, confirms the user still exists in MongoDB with `status: "active"`, and attaches role permissions.
  - `requirePermission(...)` checks exact permissions before running controllers.
  - Roles:
    - `admin` — full access across users, projects, departments, clients, audit logs, and reports.
    - `manager` — same access except `users:write` (cannot create/edit/delete user accounts).
    - `viewer` — read-only access (`users:read`, `projects:read`, `departments:read`, `clients:read`); blocked from writes, `/audit`, and `/reports`.
- **Frontend (`apps/frontend/src/features/auth/`):**
  - `ProtectedRoute.tsx` and `routePermissions.ts` block restricted pages and redirect unauthorized users to `/unauthorized`.
  - `PermissionGate.tsx` hides create/edit/delete buttons from users without write permissions (UI convenience only — backend checks remain the real security barrier).

## 4. API & Browser Hardening

- **Express hardening (`apps/backend/src/app.ts`):** `trust proxy` enabled for hosting behind Vercel, `x-powered-by` disabled, `helmet()` headers enabled, `express.json({ limit: "100kb" })` body limit.
- **Rate limiting (`apps/backend/src/middleware/rateLimiter.ts`):**
  - General `/api/*`: `300` requests per `15` minutes (skips `/api/health`).
  - `/api/auth/login` and `/api/auth/refresh`: `20` requests per `15` minutes (`TOO_MANY_REQUESTS` `429`).
- **CORS (`apps/backend/src/config/cors.ts`):** Strictly checks allowed `FRONTEND_URL` values in production (`localhost` / `127.0.0.1` allowed in non-production).
- **Safe search filters:** Dynamic regex searches escape user input (`escapeRegex` in `apps/backend/tests/securityAndUserHelpers.test.ts` coverage) and ignore malformed MongoDB ObjectIds (`buildProjectFilter`).
- **Frontend headers (`apps/frontend/vercel.json`):** Sends `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, and `Cross-Origin-Opener-Policy: same-origin`.

## 5. Honest Notes & Current Limitations

- **Rate limit store:** `express-rate-limit` currently uses default in-memory counters, which reset on serverless cold starts. For high-scale multi-instance production, switch to a shared store (e.g. Redis).
- **CSP styles:** `apps/frontend/vercel.json` currently keeps `style-src 'self' 'unsafe-inline'` for inline UI styling compatibility; `script-src` remains strictly `'self'`.
- **Dev quick-login env vars:** `VITE_DEV_ADMIN_*`, `VITE_DEV_MANAGER_*`, and `VITE_DEV_VIEWER_*` are strictly for local `.env.development` convenience and must stay unset in production deployments.
