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
└── package.json            # Root convenience scripts
```

## Architecture Overview

- **Same-Domain `/api` Proxy:** Client API requests target `/api/*` via Vite dev proxy locally and Vercel reverse-proxy rewrites in production (`apps/web/vercel.json`) so `httpOnly` `SameSite=Lax` cookies work cleanly with `connect-src 'self'`. See [Architecture Decisions](docs/decisions.md).
- **Security-First Auth & RBAC:** Short-lived in-memory JWT access tokens, rotating `httpOnly` refresh cookies with family reuse detection, HMAC double-submit CSRF checks, centralized Axios retry/cancellation/error normalization, and permission-aware routing and UI. See [Security Review](docs/reports/security-review.md).
- **Quality & Performance Gates:** Vitest, React Testing Library, MSW, Playwright, Axe WCAG 2.1 AA, Lighthouse, and Vite bundle code-splitting implemented and audited. See [Test Strategy](docs/reports/test-strategy.md) and [`docs/audits/`](docs/audits/lighthouse-report.md).

## Tech Stack

- **Frontend (`apps/web`):** React 19, TypeScript, Vite, Oxlint
- **Backend (`apps/api`):** Node.js, Express 5, TypeScript, MongoDB (Mongoose)
- **Testing & Audits:** Vitest, React Testing Library, MSW, Playwright, `@axe-core/playwright`, Lighthouse CLI

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

# Typecheck, lint, test, and build
npm run typecheck:api
npm run compile:api
npm run lint:web
npm run test:web
npm run test:e2e
npm run test:exercise
npm run build:web
```

> **Environment Variables:** Copy `apps/api/.env.example` to `apps/api/.env` (and optionally `apps/web/.env.example` to `apps/web/.env`) for local development. Never commit real `.env` files or secrets.

## Documentation & Reports

- [Architecture Decision Records](docs/decisions.md)
- [Security Review](docs/reports/security-review.md)
- [Test Strategy](docs/reports/test-strategy.md)
- [Lighthouse Audit Report](docs/audits/lighthouse-report.md)
- [Accessibility Audit Report](docs/audits/accessibility-report.md)
- [Performance & Bundle Report](docs/audits/performance-and-bundle-report.md)
- [End-to-End Verification Report](docs/audits/e2e-report.md)
- [Standalone Structured Output Adapter Exercise](exercises/structured-output-adapter/README.md)
