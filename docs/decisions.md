# Architecture Decision Records (ADRs)

This document records key architectural and technical decisions made for the Enterprise Administration Dashboard, including context, alternatives considered, and trade-offs.

---

## ADR-001: Same-Domain `/api` Reverse Proxy Rewrite Architecture

- **Status:** Accepted *(to be implemented & verified in API/proxy setup)*
- **Scope:** `apps/web`, `apps/api`, deployment routing

### Context

The application consists of two deployable units:
1. `apps/web` — React + TypeScript + Vite SPA.
2. `apps/api` — Express + MongoDB REST API handling authentication, RBAC, audit trails, and file uploads.

Authentication plans to pair short-lived in-memory JWT access tokens with refresh tokens stored in `httpOnly` cookies. If the frontend (e.g., `*.vercel.app`) calls an API hosted on a separate origin (e.g., another PaaS domain), requests become cross-site:
- Modern browsers restrict or block third-party cookies (`SameSite=None; Secure`) in Safari ITP, strict privacy modes, and incognito sessions.
- `SameSite=Lax` and `SameSite=Strict` cookies are not sent on cross-site `fetch`/XHR requests.
- Cross-origin requests require credentialed CORS with explicit origin maintenance, add preflight (`OPTIONS`) overhead, and force widening `connect-src` in Content-Security-Policy (CSP).

### Decision

Route all frontend API requests through a **same-origin `/api` path** (`/api/*`):

- **Local Development:** Configure Vite `server.proxy` in `apps/web/vite.config.ts` to forward `/api/*` to the local Express server.
- **Production:** Configure reverse-proxy rewrites (e.g., `vercel.json` `rewrites`) to forward `/api/:path*` to the deployed `apps/api` origin.

### Alternatives Considered

1. **Cross-Origin API with CORS + `SameSite=None; Secure` Cookies**
   - *Rejected:* Fragile against third-party cookie blocking in modern browsers, adds preflight latency, and widens CSRF attack surface compared to `SameSite=Lax`/`Strict`.
2. **Shared Custom Subdomains (`app.domain.com` and `api.domain.com` with `Domain=.domain.com`)**
   - *Rejected:* Requires custom DNS configuration, does not work on default PaaS preview domains, and broadens cookie scope across subdomains.
3. **Storing Refresh Tokens in `localStorage` or `sessionStorage`**
   - *Rejected:* Exposes session credentials to JavaScript, allowing any XSS vulnerability to steal refresh tokens.

### Consequences & Implementation Requirements

**Expected Benefits:**
- `httpOnly` + `SameSite=Lax` (or `Strict`) cookies operate as first-party cookies under the frontend domain.
- Removes cross-origin CORS friction and `OPTIONS` preflights from normal SPA calls.
- Keeps frontend API paths environment-agnostic (`/api/...`) and supports a tighter `connect-src 'self'` CSP.

**Trade-Offs & Required Configurations:**
- **Proxy Trust:** `apps/api` must enable `app.set('trust proxy', 1)` so Express accurately reads `X-Forwarded-For` / `X-Forwarded-Proto` for rate limiting and `Secure` cookie decisions.
- **Cookie Scoping:** Refresh cookies must scope `Path=/api` (or `Path=/api/auth`) and set `Secure` dynamically based on environment/HTTPS so both local HTTP dev and production HTTPS work reliably.
- **Payload & Timeout Limits:** Reverse-proxy hops enforce request body size and execution timeout limits (e.g., serverless proxy caps); upload limits must respect those constraints or move to direct signed storage URLs if larger uploads are needed.
- **Defense in Depth:** `apps/api` must still apply security headers (`helmet`), strict origin validation/CSRF protection on cookie-authenticated state-changing endpoints, and explicit CORS allowlists rather than relying solely on proxy routing.

### Verification Plan (Before Building Login)

Before implementing full authentication flows, deploy `apps/api` with `GET /api/health` and `apps/web` with the `/api` rewrite, set a test cookie from `/api/health`, and verify in browser DevTools that:
1. `/api/health` succeeds via the frontend domain.
2. The `Set-Cookie` header passes cleanly through the external rewrite and is stored under the frontend domain.
