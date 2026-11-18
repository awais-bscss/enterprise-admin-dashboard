# Performance & Bundle Report

Simple breakdown of the production build size, code splitting choices, and measured browser load metrics in `apps/frontend`.

## 1. Production Bundle Output (`npm run build:frontend`)

Measured from `vite build` (`2273` modules transformed in `4.81s`):

| Asset / Chunk | Raw Size | Gzip Size | Role |
| --- | --- | --- | --- |
| `index.html` | `1.22 kB` | `0.53 kB` | HTML entry |
| `index-*.css` | `79.11 kB` | `12.19 kB` | Tailwind CSS bundle |
| `vendor-react-*.js` | `249.47 kB` | `79.25 kB` | `react`, `react-dom`, `react-router`, `scheduler` |
| `vendor-data-*.js` | `94.52 kB` | `32.60 kB` | `@tanstack/react-query` and `axios` |
| `vendor-icons-*.js` | `16.14 kB` | `5.64 kB` | `lucide-react` icons |
| `index-*.js` | `40.16 kB` | `11.48 kB` | Core app entry shell |
| `DashboardPage-*.js` | `12.97 kB` | `3.71 kB` | Dashboard page (lazy-loaded) |
| `DashboardChartsGrid-*.js` | `18.81 kB` | `5.06 kB` | Custom SVG chart cards (lazy-loaded) |
| Other feature pages (`ProjectsPage`, `DepartmentsPage`, `DirectoryPage`, `ClientsPage`, modals, reports) | `0.27–13.83 kB` each | `0.20–4.24 kB` each | Lazy-loaded per route |

## 2. How Load Speed Is Kept Fast

1. **Route & Modal Code Splitting (`apps/frontend/src/app/App.tsx`):** Pages like `/dashboard`, `/projects`, `/reports`, and heavy form modals load only when opened (`React.lazy`), verified by Playwright so `/login` does not fetch dashboard bundles.
2. **Manual Vendor Chunks (`apps/frontend/vite.config.ts`):** Splits stable React, data-fetching, and icon libraries into separate cacheable bundles so app code changes do not force re-downloading React.
3. **Custom SVG Charts Instead of Heavy Libraries:** `DashboardChartsGrid` weighs only `5.06 kB` gzip.
4. **Combined Overview Endpoint:** Dashboard cards and charts share one `GET /api/dashboard/overview` call via `useDashboardOverview.ts`.
5. **Web Worker for Exports (`apps/frontend/src/workers/workspace.worker.ts`):** Formats JSON/CSV report exports off the main UI thread (`0.48 kB` worker chunk).

## 3. Measured Preview Core Web Vitals (`npm run test:e2e`)

Measured inside Playwright on `vite preview` (`http://127.0.0.1:4173`):

- `/login`: `FCP 368 ms`, `LCP 368 ms`, `CLS 0`, `41` DOM nodes
- `/dashboard`: `FCP 156 ms`, `LCP 680 ms`, `CLS ~0.004`, `484` DOM nodes
