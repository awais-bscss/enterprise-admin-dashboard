# Utilities (`src/utils`)

Pure helpers and shared server utilities imported by controllers, middleware, and unit tests.

## Files

| File | Purpose |
| --- | --- |
| `tokens.ts` | Signs/verifies 15-minute access JWTs, generates/hashes opaque refresh tokens (`SHA-256`), creates/verifies HMAC CSRF tokens, and sets/clears auth cookies |
| `audit.ts` | `recordAuditEvent()` saves audit log entries without breaking the main API response if logging fails |
| `httpErrors.ts` | `sendApiError()` sends uniform JSON error responses |
| `pagination.ts` | Parses/clamps `page` & `limit` and fetches paginated results efficiently |
| `query.ts` | Escapes regex search terms (`escapeRegex`) and summarizes `active`/`inactive` status counts |
| `passwordPolicy.ts` | Checks password complexity rules (`8+` chars with upper, lower, and number) |
| `projectHelpers.ts` | Clamps progress, builds safe filters, aggregates project deadline ordering, validates schemas, and serializes projects |
| `dashboardHelpers.ts` | Computes UTC deadline urgency buckets, weighted department progress, status counts, and activity trend series |
| `userHelpers.ts` | Formats user records, builds directory filters, and computes employee directory summary counts |
