# Security Review — Enterprise Admin Portal

**Scope:** `apps/web` (React + Vite SPA) & `apps/api` (Express + MongoDB REST API)  
**Primary Architectural Decision:** [ADR-001: Same-Domain `/api` Reverse Proxy Rewrite Architecture](../decisions.md)

---

## 1. Executive Summary

The Enterprise Admin Portal implements a defense-in-depth authentication and authorization architecture combining short-lived in-memory JWT access tokens, rotating `httpOnly` refresh cookies persisted as SHA-256 hashes with family reuse detection, HMAC-signed double-submit CSRF protection, server-enforced permission-based RBAC, rate limiting, strict production secret validation, and HTTP security headers including a strict `Content-Security-Policy` on the frontend edge configuration.

Static security controls across `apps/api` and `apps/web` have been implemented and verified against typechecking, build, and credential-hygiene checks. Live production cookie round-trips through the reverse proxy and automated end-to-end security regression suites remain to be exercised in subsequent deployment and testing verification.

---

## 2. Architecture & Origin Trust Boundaries

| Boundary | Local Development | Production Deployment | Implementation |
| --- | --- | --- | --- |
| Frontend -> API transport | Same-origin `/api` proxied to `http://localhost:4000` | Same-origin `/api/:path*` rewritten to `https://enterprise-admin-api.vercel.app/api/:path*` | [`apps/web/.env.example`](../../apps/web/.env.example), [`apps/web/vite.config.ts`](../../apps/web/vite.config.ts), [`apps/web/vercel.json`](../../apps/web/vercel.json) |
| CORS allowlist | Localhost / `127.0.0.1` ports permitted when `NODE_ENV !== "production"` | Explicit origins from comma-separated `FRONTEND_URL`, `credentials: true` | [`apps/api/src/config/cors.ts`](../../apps/api/src/config/cors.ts) |
| Reverse-proxy awareness | Express runs behind Vite dev proxy | `app.set("trust proxy", 1)` for accurate rate-limit client IP extraction | [`apps/api/src/app.ts`](../../apps/api/src/app.ts) |
| CORS rejection handling | Returns `403 CORS_FORBIDDEN` | Returns `403 CORS_FORBIDDEN` without stack leakage | [`apps/api/src/middleware/errorHandler.ts`](../../apps/api/src/middleware/errorHandler.ts) |

Keeping API traffic under same-origin `/api` paths allows `httpOnly`, `SameSite=Lax` cookies to operate reliably across modern browsers without exposing refresh credentials to cross-site cookie restrictions or requiring `SameSite=None`.

---

## 3. Authentication, Token Lifecycle & Session Isolation

### 3.1 Dual-Token Architecture

| Token / Artifact | Storage Location | Lifetime / TTL | Security Properties | Source |
| --- | --- | --- | --- | --- |
| Access token (JWT) | Frontend JS module memory only | 15 minutes (`ACCESS_TOKEN_TTL_SECONDS = 900`) | Never persisted in `localStorage` or `sessionStorage`; signed with `JWT_ACCESS_SECRET` (>= 32 chars) | [`apps/api/src/utils/tokens.ts`](../../apps/api/src/utils/tokens.ts), [`apps/web/src/lib/api.ts`](../../apps/web/src/lib/api.ts) |
| Refresh token (opaque) | `httpOnly` cookie (`refresh_token`, `path: "/api"`) + MongoDB SHA-256 hash | 7 days (`REFRESH_TOKEN_TTL_MS`) | 48 random bytes (`96` hex chars); `sameSite: "lax"`; `secure` in production; MongoDB TTL index auto-purges expired rows | [`apps/api/src/utils/tokens.ts`](../../apps/api/src/utils/tokens.ts), [`apps/api/src/models/RefreshToken.ts`](../../apps/api/src/models/RefreshToken.ts) |
| CSRF indicator cookie (`csrf_token`) | Same-origin non-httpOnly cookie (`path: "/"`) | 7 days (`REFRESH_TOKEN_TTL_MS`) | `24`-byte nonce + HMAC-SHA256 signature; doubles as session-presence signal so anonymous visitors skip unnecessary `/api/auth/refresh` calls | [`apps/api/src/utils/tokens.ts`](../../apps/api/src/utils/tokens.ts), [`apps/web/src/features/auth/AuthProvider.tsx`](../../apps/web/src/features/auth/AuthProvider.tsx) |

### 3.2 Refresh Rotation, Replay Detection & Revocation

1. **Single-use rotation:** Every successful `POST /api/auth/refresh` revokes the presented token (`revokedAt`, `replacedByHash`) and persists a replacement hash under the same `familyId`, rotating both `refresh_token` and `csrf_token` cookies ([`auth.controller.ts`](../../apps/api/src/controllers/auth.controller.ts)).
2. **Replay detection:** If an already-revoked refresh token is submitted again (`existing.revokedAt` is set), the server revokes **all** unrevoked tokens in that `familyId`, clears cookies, and returns `401 TOKEN_REUSE_DETECTED`.
3. **Explicit revocation paths:**
   - `POST /api/auth/logout` revokes active tokens in the caller's `familyId` and clears auth cookies.
   - Admin user suspension or admin password reset via `PATCH /api/users/:id` revokes every active `RefreshToken` document for that `userId` ([`users.controller.ts`](../../apps/api/src/controllers/users.controller.ts)).
   - Admin user deletion via `DELETE /api/users/:id` deletes all `RefreshToken` rows for the deleted account and reassigns owned projects to the acting admin.
4. **Client coordination & cache isolation:** [`AuthProvider.tsx`](../../apps/web/src/features/auth/AuthProvider.tsx) schedules proactive refresh 60 seconds prior to access-token expiry, [`api.ts`](../../apps/web/src/lib/api.ts) deduplicates concurrent `401` refresh retries into a single flight, and `queryClient.clear()` wipes TanStack Query state on login and logout so prior account data cannot leak across account switches.

---

## 4. CSRF, Transport & API Hardening

- **Double-Submit HMAC CSRF (`requireCsrf`):** Validates that the `Origin` header (when supplied) passes `isAllowedOrigin(origin)`, verifies equality between cookie `csrf_token` and header `x-csrf-token` using `crypto.timingSafeEqual`, and verifies the HMAC-SHA256 signature derived from `CSRF_SECRET ?? JWT_REFRESH_SECRET` ([`csrf.ts`](../../apps/api/src/middleware/csrf.ts)). Mounted on `/api/auth/refresh` and `/api/auth/logout` (while permitting `/logout` cleanup when no refresh cookie is present). Protected API resource endpoints rely on explicit `Authorization: Bearer <token>` headers rather than ambient cookies.
- **HTTP Headers & Information Minimization:** `helmet()` is active globally and `x-powered-by` is disabled in [`app.ts`](../../apps/api/src/app.ts). Production responses from `errorHandler` mask internal server error messages (`"Something went wrong"`).
- **Payload & Request Limiting:** `express.json({ limit: "100kb" })` caps JSON body size. [`rateLimiter.ts`](../../apps/api/src/middleware/rateLimiter.ts) configures:
  - `apiRateLimiter`: `300` requests / `15` minutes across `/api` (skipping `/health`)
  - `authRateLimiter`: `20` requests / `15` minutes on `POST /api/auth/login` and `POST /api/auth/refresh`
- **Input Validation & Password Storage:**
  - Startup configuration validates environment variables with Zod, enforcing >= `32`-character secrets for `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` ([`env.ts`](../../apps/api/src/config/env.ts)).
  - Request payloads in auth and user controllers validate input schemas via Zod, and search filters escape regex metacharacters (`escapeRegex`) before building MongoDB queries ([`users.controller.ts`](../../apps/api/src/controllers/users.controller.ts)).
  - Passwords are hashed with `bcryptjs` (`10` salt rounds), excluded from default Mongoose selections (`passwordHash: { select: false }` in [`User.ts`](../../apps/api/src/models/User.ts)), and validated against [`passwordPolicy.ts`](../../apps/api/src/utils/passwordPolicy.ts) (`8+` characters with uppercase, lowercase, and a numeric digit when workspace `enforceStrongPasswords` is enabled).

---

## 5. Authorization & RBAC Enforcement

### 5.1 Role & Permission Matrix

Defined in [`apps/api/src/config/rbac.ts`](../../apps/api/src/config/rbac.ts):

| Role | Granted Permissions |
| --- | --- |
| `admin` | `users:read`, `users:write`, `projects:read`, `projects:write`, `audit:read`, `reports:export`, `settings:manage` |
| `manager` | `users:read`, `projects:read`, `projects:write`, `audit:read`, `reports:export` |
| `viewer` | `users:read`, `projects:read` |

### 5.2 Server & Client Guard Alignment

- **Server enforcement (authoritative):** Every protected router (`/dashboard`, `/projects`, `/users`, `/audit`, `/reports`, `/settings`) applies `ensureDatabase` + `requireAuth` + `requirePermission(...)` ([`auth.ts`](../../apps/api/src/middleware/auth.ts), `apps/api/src/routes/*.ts`). `requireAuth` queries the user record from MongoDB on every request to verify `status === "active"` and derive live role permissions, ensuring role demotions or suspensions take effect immediately rather than waiting up to 15 minutes for JWT expiry.
- **Self-lockout guard:** [`users.controller.ts`](../../apps/api/src/controllers/users.controller.ts) blocks administrators from demoting, suspending, or deleting their own active account (`SELF_LOCKOUT_GUARD`).
- **Audit trail:** Authentication events (`auth.login`, `auth.profile_updated`), user mutations (`user.created`, `user.updated`, `user.deleted`), and workspace governance actions emit structured records via `recordAuditEvent`.
- **Client guards:** [`ProtectedRoute.tsx`](../../apps/web/src/features/auth/ProtectedRoute.tsx), [`PermissionGate.tsx`](../../apps/web/src/features/auth/PermissionGate.tsx), and [`routePermissions.ts`](../../apps/web/src/features/auth/routePermissions.ts) synchronize route navigation and action visibility with active permissions, redirecting cross-role logins away from restricted paths via `resolveLoginDestination`.

---

## 6. Content-Security-Policy (CSP) & Browser Security Headers

Configured on `/(.*)` in [`apps/web/vercel.json`](../../apps/web/vercel.json):

| Header | Configured Value | Purpose |
| --- | --- | --- |
| `Content-Security-Policy` | `default-src 'self'; base-uri 'self'; frame-ancestors 'none'; object-src 'none'; form-action 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; worker-src 'self' blob:` | Eliminates third-party script execution, disables framing/plugins/base hijacking, confines API traffic to same-origin `/api`, and permits Vite-bundled Web Workers + Blob CSV exports |
| `X-Content-Type-Options` | `nosniff` | Prevents MIME-type sniffing |
| `X-Frame-Options` | `DENY` | Legacy clickjacking defense complementing `frame-ancestors 'none'` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Limits referrer path leakage to external origins |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | Disables unused privileged browser hardware APIs |

[`apps/web/index.html`](../../apps/web/index.html) avoids inline `<script>` and inline `<style>` tags—initial dark/light theme application executes from [`apps/web/src/main.tsx`](../../apps/web/src/main.tsx)—allowing `script-src 'self'` without `'unsafe-inline'` or `'unsafe-eval'`.

---

## 7. Environment & Credential Hygiene

- Root [`.gitignore`](../../.gitignore) excludes `.env` and `.env.*` while preserving `.env.example` templates.
- [`apps/api/src/seed.ts`](../../apps/api/src/seed.ts) reads initial account credentials strictly from `process.env` via Zod (`SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, and optional manager/viewer env pairs) rather than embedded sample credentials.
- Frontend sign-in and user creation forms (`LoginPage.tsx`, `UserFormModal.tsx`) contain zero hardcoded demo passwords or sample credentials; optional quick-role autofill buttons on `LoginPage.tsx` render only when `VITE_DEV_*` variables are explicitly configured in gitignored `.env.development` or deployment environment settings.

---

## 8. Residual Risks & Remaining Hardening Items

| Area | Current Behavior | Recommended Follow-Up | Priority |
| --- | --- | --- | --- |
| Self-service password change session revocation | Admin password resets revoke user `RefreshToken` rows, whereas `updateProfile` (`PATCH /api/auth/profile`) in `auth.controller.ts` does not revoke other active refresh families for that user. | Revoke existing `RefreshToken` families (optionally preserving or rotating only the current session) on self-service password change. | Medium |
| Distributed rate limiting | `express-rate-limit` uses default process-local memory storage, which resets across serverless cold starts or multiple instances. | Configure a shared Redis/Upstash store for `apiRateLimiter` and `authRateLimiter` in multi-instance production deployments. | Medium |
| CSP `style-src 'unsafe-inline'` | Permitted because dynamic progress bar widths and Recharts SVG layout calculations apply inline style attributes. | Replace dynamic inline style attributes with utility classes / CSS custom properties where feasible to tighten `style-src 'self'`. | Low |
| Login password length floor | `loginSchema` validates `password.min(6)` on `/login` to allow legacy/relaxed accounts when `enforceStrongPasswords` is disabled in settings. | Keep strong policy enforcement enabled in production (`enforceStrongPasswords: true`) and audit legacy credentials if any were provisioned under relaxed rules. | Low |
| Deployed reverse-proxy round-trip validation | Same-origin `/api` cookie forwarding (`Set-Cookie` / `Cookie` / CSP delivery) has been reviewed statically in configuration, pending live Vercel preview/production checks. | Verify `Set-Cookie`, `401` single-flight refresh, and strict CSP console cleanliness on a live Vercel deployment. | High (Verification) |
