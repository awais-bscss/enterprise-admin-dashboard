# Lighthouse Report (Local Dev vs Live Vercel)

A straightforward summary of Chrome DevTools Lighthouse results on both `localhost` (Vite dev server) and the live Vercel deployment.

## 1. Live Production Scores (`https://enterprise-admin-dashboard-ebon.vercel.app/dashboard`)

Captured from Chrome DevTools Lighthouse on the deployed Vercel build:

| Category | Score | Notes |
| --- | --- | --- |
| **Performance** | **88** | Fast initial render (`FCP 0.6 s`, `LCP 1.4 s`, `TBT 80 ms`, `CLS 0.005`) |
| **Accessibility** | **100** | Zero accessibility issues flagged |
| **Best Practices** | **81** | Room to tighten browser/script diagnostics |
| **SEO** | **100** | Meta tags, document title, and crawl rules in place (`apps/frontend/public/robots.txt`) |

### Core Web Vitals Measured on Vercel `/dashboard`

- **First Contentful Paint (FCP):** `0.6 s`
- **Largest Contentful Paint (LCP):** `1.4 s`
- **Total Blocking Time (TBT):** `80 ms`
- **Cumulative Layout Shift (CLS):** `0.005`
- **Speed Index:** `3.1 s`

## 2. Why `localhost:5173` Scored Much Lower (`25–26` Performance)

Early local Lighthouse runs on `http://localhost:5173/dashboard` showed `Performance 25–26`, `Accessibility 96`, `Best Practices 81`, and `SEO 100`. That drop happened for two clear reasons:

1. **Dev server vs production build:** `npm run dev` serves unminified, unbundled modules with Vite HMR, so Lighthouse sees many extra module requests and slower JS evaluation (`FCP 6.2 s`, `LCP 11.8 s`, `TBT 2,050 ms`).
2. **Chrome extensions active:** Chrome DevTools showed the warning *"Chrome extensions negatively affected this page's load performance. Try auditing the page in incognito mode or from a Chrome profile without extensions."* Extensions inject extra scripts on every page load.

**Rule of thumb for accurate audits:** Always test `npm run build:frontend` + `npm run preview` (or the live Vercel URL) in an **Incognito** window with extensions disabled.

## 3. Remaining Optimization Areas Seen in Diagnostics

From the Vercel Lighthouse insights/diagnostics panel:

- **Main-thread & JS execution time:** Reduce unused JavaScript and heavy main-thread work where possible (though DevTools extensions can also inflate reported JS time).
- **Render-blocking / Speed Index (`3.1 s`):** Keep above-the-fold styles light and verify network waterfall in clean Incognito runs.
- **Automated follow-ups:** Ongoing route-level Accessibility (`@axe-core/playwright`) and runtime CLS/LCP checks live in `apps/frontend/e2e/accessibility-performance.spec.ts` (run with `npm run test:e2e`).
