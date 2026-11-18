# Backend Unit Tests (`tests`)

Fast Node.js built-in test suite (`node --import tsx --test`) covering pure backend business logic without needing a live MongoDB connection.

## Test Files (13 Tests Total)

- `dashboardHelpers.test.ts` (`4` tests) — UTC deadline urgency thresholds (`critical`/`warning`/`upcoming`), active-department progress math, status buckets, and dashboard overview formatting
- `projectHelpers.test.ts` (`5` tests) — `100%` progress clamping on completed projects, team deduplication, ignoring invalid MongoDB ObjectIds in filters, sorting deadlines with null due dates last, and Zod schema validation
- `securityAndUserHelpers.test.ts` (`4` tests) — RBAC role permission isolation, password rules (`8+` chars with upper, lower, digit), `escapeRegex()`, and user directory filtering/summaries

## Running Tests

From root or inside `apps/backend`:

```bash
npm run test:backend
# or inside apps/backend:
npm test
```
