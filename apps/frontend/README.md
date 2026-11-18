# Frontend App (`apps/frontend`)

React 19 + TypeScript + Vite dashboard UI for workspace management, charts, role-based pages, and accessible tables/forms.

## Tech Stack

- **UI:** React 19, TypeScript, Tailwind CSS v4, Lucide icons
- **Routing & Server State:** React Router v7, TanStack Query v5, Axios
- **Charts:** Custom responsive SVG components (no heavy third-party chart library)
- **Quality & Testing:** `oxlint`, Vitest, React Testing Library, MSW, Playwright, `@axe-core/playwright`

## Folder Structure

```text
apps/frontend/
├── src/
│   ├── app/          # Root App router & lazy page loaders
│   ├── components/   # Reusable UI components -> see src/components/README.md
│   ├── features/     # Feature pages & modals -> see src/features/README.md
│   ├── hooks/        # Custom hooks for forms & data -> see src/hooks/README.md
│   ├── lib/          # API client, cookies, formatters, validation -> see src/lib/README.md
│   ├── services/     # Shared API request wrapper
│   ├── theme/        # Dark/light theme provider and tokens
│   ├── types/        # Shared TypeScript interfaces
│   ├── workers/      # Web Worker for JSON/CSV report formatting
│   └── test/         # Shared Vitest/MSW test helpers & fixtures
├── e2e/              # Playwright browser & Axe accessibility tests
├── public/           # Static assets (robots.txt, icons)
├── .env.example      # Sample frontend env variables
├── vite.config.ts    # Proxy (/api -> localhost:4000) and vendor chunk splitting
└── vercel.json       # SPA routing + /api proxy rewrite + security headers
```

## Subfolder Guides

- [src/features/README.md](src/features/README.md) — page modules, charts, and modals
- [src/hooks/README.md](src/hooks/README.md) — data fetching, form state, and filter hooks
- [src/components/README.md](src/components/README.md) — shared UI building blocks
- [src/lib/README.md](src/lib/README.md) — HTTP client, token/CSRF handling, cookies, and helpers

## Page Routes

Defined in `src/app/App.tsx`:

- `/login` — Sign-in page (plus optional quick dev login buttons when configured in `.env.development`)
- `/unauthorized` — Shown when a signed-in user lacks permission for a page
- `/dashboard` — Main overview cards, deadline alerts, and charts
- `/projects` — Project directory, filters, sorting, pagination, create/edit modal (`projects:read`)
- `/departments` — Department list with team & project drill-down links (`departments:read`)
- `/clients` — Client accounts with linked project filters (`clients:read`)
- `/employees` — Employee directory & role/account management (`users:read`; `/users` and `/directory` redirect here)
- `/audit` — Recent workspace activity log (`audit:read`)
- `/reports` — Filterable report builder and CSV/JSON export (`reports:export`)

All dashboard pages use lazy loading (`React.lazy` + `Suspense`) so users do not download chart or page bundles before logging in.

## Environment Variables (`apps/frontend/.env.development`)

Start from `apps/frontend/.env.example`:

- `VITE_API_BASE_URL` — defaults to `/api` (Vite forwards `/api` to `http://localhost:4000` in dev/preview; `vercel.json` forwards `/api` to the backend in production).
- `VITE_DEV_ADMIN_*`, `VITE_DEV_MANAGER_*`, `VITE_DEV_VIEWER_*` — optional dev-only helper buttons on `/login` for quick role switching.

## Scripts

Run inside `apps/frontend` (or from root using `:frontend` scripts):

```bash
npm run dev             # Start Vite dev server on http://localhost:5173
npm run build           # Type-check and build production bundle to dist/
npm run preview         # Preview production build locally
npm run lint            # Run oxlint across src/
npm run typecheck:tests # Type-check TypeScript files
npm run test            # Run Vitest unit & integration tests
npm run test:coverage   # Run Vitest with coverage report
npm run test:e2e        # Run Playwright browser + Axe tests
```
