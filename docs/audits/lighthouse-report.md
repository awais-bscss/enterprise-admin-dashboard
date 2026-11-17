# Lighthouse Audit Report — Enterprise Admin Portal

**Audited Target:** `http://127.0.0.1:4174/login` (`apps/web` production build served via `vite preview`)  
**Browser:** Headless Chromium (`159.0.8154.6`) via Lighthouse CLI

---

## 1. Category Scores

| Category | Measured Score | Status |
| --- | --- | --- |
| **Performance** | `97 / 100` | Pass |
| **Accessibility** | `100 / 100` | Pass |
| **Best Practices** | `100 / 100` | Pass |
| **SEO** | `100 / 100` | Pass |

---

## 2. Core Web Vitals & Timing Metrics

| Audit Metric | Display Value | Raw Value | Lighthouse Score |
| --- | --- | --- | --- |
| First Contentful Paint (`FCP`) | `0.8 s` | `752.854 ms` | `1.00` |
| Largest Contentful Paint (`LCP`) | `0.8 s` | `752.854 ms` | `1.00` |
| Total Blocking Time (`TBT`) | `210 ms` | `208.573 ms` | `0.89` |
| Cumulative Layout Shift (`CLS`) | `0` | `0` | `1.00` |
| Speed Index | `0.8 s` | `752.854 ms` | `1.00` |
| Time to Interactive (`TTI`) | `2.1 s` | `2148.854 ms` | `0.99` |

---

## 3. Optimizations Reflected in Final Run

1. **Vendor & Route Splitting (`apps/web/vite.config.ts`):** Isolated `vendor-react`, `vendor-data`, and `vendor-icons` from the application entry (`42.60 kB` / `12.63 kB` gzip) and deferred `DashboardPage` (`Recharts`) loading until sign-in.
2. **HTML Document Hygiene (`apps/web/index.html` & `apps/web/public/robots.txt`):** Added descriptive `<meta name="description">`, `<meta name="theme-color">`, and valid `robots.txt` (`Disallow: /api/`), resolving SPA fallback SEO errors cleanly (`SEO` improved from `91` to `100`).
3. **Accessibility Remediation:** Fixed dark-mode contrast and WCAG 2.5.3 Label-in-Name mismatches in layout and pagination controls.

---

## 4. Scope Boundary

- This Lighthouse CLI run audited the unauthenticated production entry route (`/login`) in local `vite preview`.
- Authenticated application routes (`/dashboard`, `/projects`, `/users`, `/audit`, `/reports`, `/settings`) were separately measured via Playwright `PerformanceObserver` telemetry and `@axe-core/playwright` (`100%` pass) in [`performance-and-bundle-report.md`](performance-and-bundle-report.md) and [`accessibility-report.md`](accessibility-report.md).
