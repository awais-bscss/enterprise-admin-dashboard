# Enterprise Project & Admin Dashboard

A full-stack admin workspace for managing projects, departments, clients, employees, audit logs, and exportable reports with role-based access control (`admin`, `manager`, `viewer`).

## Repository Structure

```text
.
├── apps/
│   ├── frontend/    # React + TypeScript + Vite dashboard app
│   └── backend/     # Express + TypeScript + MongoDB API server
├── docs/            # Architecture, security, test, and audit notes
└── package.json     # Root workspace scripts
```

## App & Folder Guides

- Frontend guide: [apps/frontend/README.md](apps/frontend/README.md)
  - Feature pages: [apps/frontend/src/features/README.md](apps/frontend/src/features/README.md)
  - Custom hooks: [apps/frontend/src/hooks/README.md](apps/frontend/src/hooks/README.md)
  - Shared UI components: [apps/frontend/src/components/README.md](apps/frontend/src/components/README.md)
  - Client & utility helpers: [apps/frontend/src/lib/README.md](apps/frontend/src/lib/README.md)
- Backend guide: [apps/backend/README.md](apps/backend/README.md)

## Quick Start (Local Development)

### 1. Install dependencies

```bash
npm install
npm run install:backend
npm run install:frontend
```

### 2. Configure environment files

Copy the example env files and fill in your local values (MongoDB connection string and JWT secrets):

```bash
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env.development
```

- Backend variables are documented in [apps/backend/README.md](apps/backend/README.md).
- Frontend variables are documented in [apps/frontend/README.md](apps/frontend/README.md).

### 3. Run backend and frontend locally

Run each service from the root folder in separate terminals:

```bash
# Terminal 1 (Backend on http://localhost:4000)
npm run dev:backend

# Terminal 2 (Frontend on http://localhost:5173)
npm run dev:frontend
```

During local development, Vite proxies `/api/*` requests from `:5173` to `:4000` so login and refresh cookies stay on the same origin.

## Common Root Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev:backend` | Run backend server (`tsx watch`) |
| `npm run dev:frontend` | Run frontend server (`vite`) |
| `npm run build:frontend` | Type-check and build frontend (`apps/frontend/dist`) |
| `npm run lint:frontend` | Run `oxlint` on frontend code |
| `npm run typecheck:backend` | Type-check backend TypeScript |
| `npm run compile:backend` | Compile backend TypeScript (`tsc`) |
| `npm run test:backend` | Run Node built-in unit tests for backend helpers |
| `npm run test:frontend` | Run Vitest unit & integration tests for frontend |
| `npm run test:e2e` | Run Playwright end-to-end & accessibility tests |

## Documentation Index

- Architecture decisions: [docs/decisions.md](docs/decisions.md)
- Security overview: [docs/reports/security-review.md](docs/reports/security-review.md)
- Testing overview: [docs/reports/test-strategy.md](docs/reports/test-strategy.md)
- Audit notes:
  - [docs/audits/accessibility-report.md](docs/audits/accessibility-report.md)
  - [docs/audits/e2e-report.md](docs/audits/e2e-report.md)
  - [docs/audits/performance-and-bundle-report.md](docs/audits/performance-and-bundle-report.md)
  - [docs/audits/lighthouse-report.md](docs/audits/lighthouse-report.md)
