# Performance & Bundle Analysis Report — Enterprise Admin Portal

**Build Pipeline:** Vite `8.3.8` (Rolldown bundler) + `@tailwindcss/vite` (`4.3.5`)  
**Audited Source:** [`apps/web/vite.config.ts`](../../apps/web/vite.config.ts), [`apps/web/src/hooks/useLoginForm.ts`](../../apps/web/src/hooks/useLoginForm.ts), [`apps/web/e2e/accessibility-performance.spec.ts`](../../apps/web/e2e/accessibility-performance.spec.ts)

---

## 1. Production Bundle Comparison (Before vs After Optimization)

| Artifact | Before `manualChunks` | After `manualChunks` | Gzip (After) | Optimization Impact |
| --- | --- | --- | --- | --- |
| Entry script (`index-*.js`) | `384.52 kB` (`123.77 kB` gzip) | `36.19 kB` | `10.94 kB` | **`-90.6%` raw entry JS**; isolates app releases from vendor cache invalidation |
| `vendor-react-*.js` | Bundled in entry | `245.68 kB` | `78.33 kB` | Long-term immutable cache (`react`, `react-dom`, `react-router`, `scheduler`) |
| `vendor-data-*.js` | Bundled in entry | `86.74 kB` | `30.05 kB` | Long-term immutable cache (`@tanstack/react-query`, `axios`) |
| `vendor-icons-*.js` | Bundled in entry | `18.00 kB` | `6.19 kB` | Shared icon module split cleanly out of app entry |
| `vendor-charts-*.js` | Bundled in dashboard | `417.02 kB` | `118.34 kB` | Shared Recharts/d3 chunk loaded only when lazy chart grid mounts |
| `DashboardPage-*.js` | `437.64 kB` (`122.54 kB` gzip) | `13.20 kB` | `3.79 kB` | Lazy route shell without Recharts or modals (**`-97.0%`**) |
| `DashboardChartsGrid-*.js` | Bundled in dashboard | `14.49 kB` | `3.58 kB` | Lazy analytics charts wrapper behind `<DashboardChartsSkeleton />` |
| `DirectoryPage-*.js` | `13.20 kB` (`3.51 kB` gzip) | `12.59 kB` | `3.43 kB` | Route-lazy user directory view |
| `ProjectsPage-*.js` | `9.95 kB` (`3.16 kB` gzip) | `16.99 kB` | `5.39 kB` | Route-lazy paginated projects workspace + CSV/JSON import modal |
| `ProjectFormModal-*.js` | `8.95 kB` (`2.80 kB` gzip) | `7.81 kB` | `2.56 kB` | Lazy modal bundle |
| `UserFormModal-*.js` | `6.85 kB` (`2.43 kB` gzip) | `5.94 kB` | `2.16 kB` | Lazy modal bundle |
| `ProfileModal-*.js` | Bundled in layout | `4.58 kB` | `1.64 kB` | Lazy account profile modal in sidebar/topbar shell |
| `AuditLogsPage-*.js` | `5.47 kB` (`2.00 kB` gzip) | `5.68 kB` | `2.16 kB` | Route-lazy audit table |
| `SettingsPage-*.js` | `5.52 kB` (`1.99 kB` gzip) | `5.34 kB` | `1.91 kB` | Route-lazy workspace settings |
| `ReportsPage-*.js` | `4.50 kB` (`1.55 kB` gzip) | `4.40 kB` | `1.47 kB` | Route-lazy export view |
| `index-*.css` | `66.20 kB` (`10.24 kB` gzip) | `68.30 kB` | `10.85 kB` | Tailwind v4 utility CSS bundle with centralized brand tokens |
| `workspace.worker-*.js` | `0.48 kB` | `0.48 kB` | — | Dedicated module Web Worker for CSV/JSON formatting |

---

## 2. Measured Core Web Vitals (Chromium `PerformanceObserver`)

Captured via [`accessibility-performance.spec.ts`](../../apps/web/e2e/accessibility-performance.spec.ts) against `vite preview`:

| Route | FCP | LCP | CLS | Total DOM Nodes | Chart Chunk Requested? |
| --- | --- | --- | --- | --- | --- |
| `/login` | `308 ms` | `308 ms` | `0` | `42` | No (`0` chart bytes) |
| `/dashboard` | `208 ms` | `732 ms` | `0.0025` | `472` | Yes (lazy-loaded on route entry) |

---

## 3. Applied Runtime & Network Optimizations

1. **Removed Unauthenticated Dashboard Preload on `/login`:** [`useLoginForm.ts`](../../apps/web/src/hooks/useLoginForm.ts) previously invoked `preloadRoute('/dashboard')` on mount, eagerly downloading `DashboardPage` + `Recharts` (`434.98 kB`) for unauthenticated visitors. Preloading now occurs after successful login or sidebar link hover/focus.
2. **Chart & Modal Lazy Splitting + Parallel Token Refresh:** [`DashboardPage.tsx`](../../apps/web/src/features/dashboard/DashboardPage.tsx) and [`DashboardLayout.tsx`](../../apps/web/src/components/layout/DashboardLayout.tsx) split `Recharts` (`vendor-charts`) behind [`DashboardChartsGrid.tsx`](../../apps/web/src/features/dashboard/components/DashboardChartsGrid.tsx) + `<DashboardChartsSkeleton />` and defer modals until open; [`auth.controller.ts`](../../apps/api/src/controllers/auth.controller.ts) runs refresh writes in parallel (`Promise.all`) with `.lean()` projections.
3. **Bounded Server Pagination & Query Caching:** [`queryClient.ts`](../../apps/web/src/lib/queryClient.ts) caches query results (`staleTime: 30_000`) with `keepPreviousData` across paginated `Projects`, `Users`, and `AuditLogs` pages, keeping active DOM nodes well under `600` (`519` on `/dashboard`) without needing client-side list virtualization.
4. **Web Worker Computation Offloading:** [`workerClient.ts`](../../apps/web/src/lib/workerClient.ts) and [`workspace.worker.ts`](../../apps/web/src/workers/workspace.worker.ts) offload JSON pretty-printing and formula-escaped CSV serialization off the main UI thread, preserving responsive input (`INP`).
