# Routes (`src/routes`)

Express routers mounted under `/api` in `src/routes/index.ts`.

## Route Map

| File | Base Path | Key Endpoints & Guards |
| --- | --- | --- |
| `index.ts` | `/api` | Mounts every resource router |
| `health.routes.ts` | `/api/health` | `GET /` (public health check) |
| `auth.routes.ts` | `/api/auth` | `POST /login` (`authRateLimiter`), `POST /refresh` (`authRateLimiter` + `requireCsrf`), `POST /logout` (`requireCsrf`), `GET /me` (`requireAuth`), `PATCH /profile` (`requireAuth`) |
| `dashboard.routes.ts` | `/api/dashboard` | `GET /overview`, `/summary`, `/track-progress`, `/status-breakdown`, `/employee-status`, `/activity-trend` (`users:read`) |
| `projects.routes.ts` | `/api/projects` | `GET /` (`projects:read`), `POST /`, `PATCH /:id`, `DELETE /:id` (`projects:write`) |
| `departments.routes.ts` | `/api/departments` | `GET /` (`departments:read`), `POST /`, `PATCH /:id`, `DELETE /:id` (`departments:write`) |
| `clients.routes.ts` | `/api/clients` | `GET /` (`clients:read`), `POST /`, `PATCH /:id`, `DELETE /:id` (`clients:write`) |
| `users.routes.ts` | `/api/users` | `GET /` (`users:read`), `POST /`, `PATCH /:id`, `DELETE /:id` (`users:write` — admin only) |
| `audit.routes.ts` | `/api/audit` | `GET /` (`audit:read`) |
| `reports.routes.ts` | `/api/reports` | `GET /export` (`reports:export`) |
