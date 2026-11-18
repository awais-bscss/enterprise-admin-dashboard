# Backend API (`apps/backend`)

Express 5 + TypeScript + MongoDB (Mongoose) REST API for authentication, dashboard summaries, workspace CRUD, audit logs, and report data.

## Tech Stack

- **Runtime & Framework:** Node.js, Express 5, TypeScript
- **Database:** MongoDB with Mongoose
- **Validation:** Zod
- **Auth & Security:** `jsonwebtoken`, `bcryptjs`, `helmet`, `cors`, `cookie-parser`, `express-rate-limit`
- **Tests:** Node.js built-in test runner (`node --test`) via `tsx`

## Folder Structure

```text
apps/backend/
├── api/               # Vercel serverless entry point (api/index.ts -> src/app.ts)
├── src/
│   ├── config/        # Env, DB, CORS, RBAC roles -> see src/config/README.md
│   ├── controllers/   # Request handlers -> see src/controllers/README.md
│   ├── middleware/    # Auth, CSRF, DB guard, rate limits -> see src/middleware/README.md
│   ├── models/        # Mongoose schemas -> see src/models/README.md
│   ├── routes/        # API routes (/api/*) -> see src/routes/README.md
│   ├── utils/         # Tokens, pagination, query & domain helpers -> see src/utils/README.md
│   ├── app.ts         # Express app setup (middleware + /api routes)
│   ├── server.ts      # Local HTTP server entry point
│   └── seed.ts        # Database seed script for roles & sample records
├── tests/             # Backend helper unit tests -> see tests/README.md
├── .env.example       # Sample environment variables
├── vercel.json        # Serverless deployment configuration
└── package.json
```

## Subfolder Guides

- [src/config/README.md](src/config/README.md) — environment validation, database cache, CORS, and RBAC roles
- [src/middleware/README.md](src/middleware/README.md) — JWT auth, CSRF checks, DB guard, rate limiting, and error handling
- [src/models/README.md](src/models/README.md) — MongoDB collections and Mongoose schemas
- [src/routes/README.md](src/routes/README.md) — `/api/*` endpoints and permission guards
- [src/controllers/README.md](src/controllers/README.md) — resource request handlers
- [src/utils/README.md](src/utils/README.md) — tokens, audit logs, pagination, filters, and domain helpers
- [tests/README.md](tests/README.md) — backend unit test suite (`13` tests)

## API Endpoints (`/api`)

All API routes are mounted in `src/routes/index.ts`:

| Mount Path         | Purpose                                                        |
| ------------------ | -------------------------------------------------------------- |
| `/api/health`      | Health check endpoint (skipped by API rate limiter)            |
| `/api/auth`        | Login, refresh token rotation, logout, current user (`/me`)    |
| `/api/dashboard`   | Combined overview data for dashboard cards, alerts, and charts |
| `/api/projects`    | List, filter, create, update, and delete projects              |
| `/api/departments` | List, create, update, and delete departments                   |
| `/api/clients`     | List, create, update, and delete clients                       |
| `/api/users`       | Manage employee/user accounts and roles                        |
| `/api/audit`       | Read recent audit log entries                                  |
| `/api/reports`     | Fetch filtered records for workspace reports                   |

## Roles & Permissions (`src/config/rbac.ts`)

Every protected route checks both authentication (`requireAuth`) and the user's role permissions:

| Role      | Access                                                                                            |
| --------- | ------------------------------------------------------------------------------------------------- |
| `admin`   | Full read/write access across users, projects, departments, clients, audit logs, and reports      |
| `manager` | Same as `admin`, except managing user accounts (`users:write` is admin-only)                      |
| `viewer`  | Read-only access to users, projects, departments, and clients (no writes, audit logs, or reports) |

## Environment Variables (`apps/backend/.env`)

Start from `apps/backend/.env.example`:

- `NODE_ENV` — `development` or `production`
- `PORT` — local port (default `4000`)
- `MONGODB_URI` — MongoDB connection string
- `JWT_ACCESS_SECRET` — secret for signing short-lived access tokens (15 minutes)
- `JWT_REFRESH_SECRET` — secret for auth/refresh handling
- `FRONTEND_URL` — allowed frontend origin for CORS (e.g. `http://localhost:5173`)
- `CSRF_SECRET` — HMAC secret for signing CSRF tokens (falls back to `JWT_REFRESH_SECRET` if unset)
- `SEED_ADMIN_*`, `SEED_MANAGER_*`, `SEED_VIEWER_*` — email/password values used when running `npm run seed`

## Scripts

Run inside `apps/backend` (or from root using `:backend` scripts):

```bash
npm run dev        # Start local server in watch mode (tsx watch src/server.ts)
npm run typecheck  # Type-check without emitting files
npm run compile    # Build JavaScript output with tsc
npm run test       # Run helper unit tests in tests/
npm run seed       # Seed initial database records
```
