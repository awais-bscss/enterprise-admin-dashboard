# Controllers (`src/controllers`)

Request handlers validate inputs (using Zod where applicable), query MongoDB, write audit entries for key actions, and return consistent `{ ok: true, data }` or `{ ok: false, error }` JSON responses.

## Files

| File | Responsibility |
| --- | --- |
| `auth.controller.ts` | Login, refresh token rotation, logout, current profile lookup (`/me`), and self profile updates |
| `dashboard.controller.ts` | Builds combined dashboard stats, deadline alerts, department progress, and trend summaries |
| `projects.controller.ts` | Paginated project search/filtering, create, update, and delete handlers |
| `departments.controller.ts` | Department listing with linked employee/project counts, plus CRUD handlers |
| `clients.controller.ts` | Client directory listing and CRUD handlers |
| `users.controller.ts` | Employee listing, role/status updates, and account creation/deletion |
| `audit.controller.ts` | Paginated audit log filtering by resource type/search |
| `reports.controller.ts` | Compliance and workspace export payloads for `/api/reports/export` |
| `health.controller.ts` | Service and database status response (`GET /api/health`) |
