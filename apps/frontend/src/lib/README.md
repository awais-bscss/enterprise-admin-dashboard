# Client & Utility Helpers (`src/lib`)

Core infrastructure helpers used by hooks, providers, and UI forms.

## Files

| File | Purpose |
| --- | --- |
| `api.ts` | Shared Axios instance (`request()`), attaches `Bearer` token, reads `csrf_token` header/cookie when needed, coalesces concurrent `401` refreshes into one `/api/auth/refresh` call, and retries transient `GET` errors |
| `cookies.ts` | Reads cookies asynchronously (`getCookieAsync`) via browser `cookieStore` when available, falling back to `document.cookie` |
| `errors.ts` | Converts API and Axios failures into consistent UI error messages (`ApiError`) |
| `formatters.ts` | Extracts user initials, calculates UTC deadline countdown labels, and formats relative timestamps |
| `queryClient.ts` | Configures default TanStack Query cache/retry behavior |
| `queryKeys.ts` | Centralized cache keys (`queryKeys`) for clean invalidation after mutations |
| `validation.ts` | Lightweight client-side email, string length, and password validators |
| `workerClient.ts` | Wrapper around the Web Worker used to format CSV/JSON reports off the main thread |

Unit tests for these helpers live right beside them (`api.test.ts`, `cookies.test.ts`, `formatters.test.ts`, and `validation.test.ts`).
