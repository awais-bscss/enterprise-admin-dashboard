# Architecture Decisions

Simple notes explaining the main technical choices in this project and why they were made.

## ADR-001: Keep Frontend and Backend on the Same Domain (`/api` Proxy)

### Decision

All browser requests go to relative `/api/...` paths (`VITE_API_BASE_URL=/api`):

- **Local development & preview:** `apps/frontend/vite.config.ts` proxies `/api` to `http://localhost:4000`.
- **Production (Vercel):** `apps/frontend/vercel.json` rewrites `/api/:path*` to the deployed backend API.

### Why (Simple Explanation)

1. **Authentication cookies work reliably:** Modern browsers block or restrict cross-site cookies (`SameSite=Lax` / third-party cookie rules). Sending API requests through the same domain keeps the `httpOnly` `refresh_token` cookie and `csrf_token` cookie working without special workarounds.
2. **Simpler client code:** The frontend never needs hardcoded production backend URLs inside API modules.
3. **Cleaner CORS handling:** Users stay on one origin in the browser, while the backend still validates allowed origins (`FRONTEND_URL`) in `apps/backend/src/config/cors.ts`.

### Trade-off

- In Vercel, any deployment needs the rewrite destination in `apps/frontend/vercel.json` to match the live backend URL.

---

## ADR-002: Custom SVG Charts and One Combined Overview Call

### Decision

1. Build dashboard charts with lightweight custom SVG React components inside `apps/frontend/src/features/dashboard/components/` instead of installing a heavy chart library.
2. Load dashboard cards, deadline alerts, and charts through one endpoint (`GET /api/dashboard/overview`) using `apps/frontend/src/hooks/useDashboardOverview.ts`.
3. Lazy-load dashboard pages and chart panels (`React.lazy` in `apps/frontend/src/app/App.tsx`).

### Why (Simple Explanation)

1. **Smaller JavaScript bundle:** Heavy chart libraries often add 100–250 kB of extra JavaScript. Custom SVG charts keep `DashboardChartsGrid` small (`18.81 kB` raw / `5.06 kB` gzip) and do not load at all on `/login`.
2. **Faster dashboard load:** Fetching `/api/dashboard/overview` in one request avoids waiting for 5 separate API round-trips and keeps all dashboard cards in sync.
3. **Full accessibility & style control:** Custom SVG components use theme colors, readable labels, and keyboard/screen-reader attributes directly.

### Trade-off

- Adding completely new chart types (like zoomable time-series maps) takes slightly more custom code than plugging in a full chart library, though keeping individual breakdown endpoints (`/summary`, `/track-progress`, `/status-breakdown`, `/employee-status`, `/activity-trend`) makes future changes easy.
