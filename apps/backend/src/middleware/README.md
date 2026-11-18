# Middleware (`src/middleware`)

Express middleware functions that protect routes, verify database availability, and standardize error responses.

## Files

| File | Purpose |
| --- | --- |
| `auth.ts` | `requireAuth` checks the `Bearer` JWT access token and confirms the user is `active` in MongoDB; `requirePermission` checks the user's RBAC permissions |
| `csrf.ts` | `requireCsrf` checks `Origin` plus `csrf_token` cookie vs `x-csrf-token` header (`timingSafeEqual`) before allowing `/auth/refresh` or `/auth/logout` |
| `ensureDb.ts` | `ensureDatabase` ensures MongoDB is connected before handling API routes, returning `503 DB_UNAVAILABLE` if offline |
| `rateLimiter.ts` | `apiRateLimiter` (`300` req / `15m`, skips `/health`) and stricter `authRateLimiter` (`20` req / `15m` for login/refresh) |
| `notFound.ts` | Returns a consistent JSON `404 NOT_FOUND` response for unmatched routes |
| `errorHandler.ts` | Global Express error handler returning JSON `403 CORS_FORBIDDEN` or `500 INTERNAL_SERVER_ERROR` |
