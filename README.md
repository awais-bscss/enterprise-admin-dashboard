# Enterprise Administration Dashboard

Production-focused Enterprise Administration Dashboard built with a **React + TypeScript + Vite** frontend and an **Express + MongoDB** backend, emphasizing secure authentication and RBAC, resilient API architecture, comprehensive testing, and measured web performance.

## Repository Structure

```text
.
├── apps/
│   ├── web/                # React + TypeScript + Vite dashboard application
│   └── api/                # Express + MongoDB backend service
├── docs/
│   ├── decisions.md        # Architecture Decision Records (ADRs)
│   ├── reports/            # Security review and test strategy docs
│   └── audits/             # Lighthouse, accessibility, performance, bundle, and E2E reports
├── exercises/              # Standalone technical exercises (isolated from the main app)
├── .github/
│   └── pull_request_template.md
└── package.json            # Root convenience scripts
```

## Planned Architecture

- **Same-Domain `/api` Proxy *(planned)*:** Client API requests will target `/api/*` via Vite dev proxy locally and reverse-proxy rewrites in production so `httpOnly` `SameSite` cookies work reliably without cross-site cookie restrictions. See [Architecture Decisions](docs/decisions.md).
- **Security-First Auth & RBAC *(planned)*:** Short-lived in-memory access tokens, rotating `httpOnly` refresh cookies, centralized request cancellation/retry/error normalization, and permission-aware routing and UI.
- **Quality & Performance Gates *(planned)*:** Vitest + React Testing Library + Playwright test pyramid alongside measured Core Web Vitals, accessibility, and bundle audits.

## Tech Stack

- **Frontend (`apps/web`):** React 19, TypeScript, Vite, Oxlint
- **Backend (`apps/api`):** Node.js, Express 5, TypeScript, MongoDB (Mongoose)
- **Testing & Audits:** Vitest, React Testing Library, Playwright, Lighthouse *(setup pending)*

## Getting Started

### Prerequisites

- Node.js (LTS 20+ recommended)
- npm (10+)
- MongoDB Atlas or local MongoDB connection string

### Root Scripts

Each application (`apps/web`, `apps/api`) maintains its own independent `package.json` and `package-lock.json`. From the repository root:

```bash
# Install dependencies
npm run install:web
npm run install:api

# Start development servers
npm run dev:api
npm run dev:web

# Typecheck, lint, and build
npm run typecheck:api
npm run compile:api
npm run lint:web
npm run build:web
```

> **Environment Variables:** Copy `apps/api/.env.example` to `apps/api/.env` (and optionally `apps/web/.env.example` to `apps/web/.env`) for local development. Never commit real `.env` files or secrets.

## Documentation & Reports

- [Architecture Decision Records](docs/decisions.md)
- `docs/reports/` — Security review and test strategy documents *(upcoming)*
- `docs/audits/` — Lighthouse, accessibility, performance, bundle analysis, and E2E reports *(upcoming)*
