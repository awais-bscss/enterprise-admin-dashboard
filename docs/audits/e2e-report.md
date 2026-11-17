# End-to-End (E2E) Verification Report — Enterprise Admin Portal

**Runner:** Playwright Test (`1.65.1`) + Headless Chromium (`159.0.8154.6`)  
**Target Under Test:** Compiled production bundle (`apps/web/dist`) served via `vite preview` at `http://127.0.0.1:4173`  
**Shared Network Harness:** [`apps/web/e2e/mockBackend.ts`](../../apps/web/e2e/mockBackend.ts)

---

## 1. Executed Test Suites (`3 passed / 0 failed`)

| Spec File | Test Case | Runtime | Outcome |
| --- | --- | --- | --- |
| [`accessibility-performance.spec.ts`](../../apps/web/e2e/accessibility-performance.spec.ts) | `passes Axe accessibility checks on login and across authenticated routes in dark mode` | `15.9 s` | Pass (`0` WCAG 2.1 AA violations) |
| [`accessibility-performance.spec.ts`](../../apps/web/e2e/accessibility-performance.spec.ts) | `records clean Core Web Vitals bounds and avoids eager dashboard chart chunk loading on /login` | `2.2 s` | Pass (`CLS <= 0.0025`, `LCP <= 732 ms`, deferred charts verified) |
| [`auth-projects-rbac.spec.ts`](../../apps/web/e2e/auth-projects-rbac.spec.ts) | `enforces auth redirects, project creation for admin, logout, and cross-role RBAC guards for viewer` | `5.0 s` | Pass |

---

## 2. End-to-End Journey Assertions Covered

1. **Unauthenticated route protection:** Visiting `/settings` logged out redirects cleanly to `/login`.
2. **Error handling:** Invalid credentials remain on `/login` and render accessible `role="alert"` error feedback.
3. **Authenticated Admin flow:** Admin sign-in restores permitted return URL (`/settings`), navigates across `Overview` (`/dashboard`) and `Projects` (`/projects`), opens `ProjectFormModal`, submits `Zero Trust Policy Rollout`, and verifies card + toast persistence.
4. **Session cleanup & cross-role RBAC:** Logging out clears `csrf_token` cookie and routes to `/login`; signing back in as `viewer` safely resolves `/dashboard` instead of the stale `/settings` redirect, displays sidebar role lock indicators (`3` restricted sections), redirects direct `/settings` visits to `/unauthorized` (`Access Restricted`), and hides `New Project` controls on `/projects`.

---

## 3. Standalone Isolated Exercise Verification

The standalone untrusted structured output adapter in [`exercises/structured-output-adapter/README.md`](../../exercises/structured-output-adapter/README.md) was also verified independently via Node.js built-in test runner (`node --test`):

```bash
npm run test:exercise
```

- `4 / 4` test cases passed (`v1` full adaptation, `v2` schema drift + fenced JSON + XSS/URI blocking, malformed fallback mode, and reference-stable derived selector memoization).
