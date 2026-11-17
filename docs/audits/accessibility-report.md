# Accessibility Audit Report — Enterprise Admin Portal

**Standards Checked:** WCAG 2.0 A/AA & WCAG 2.1 A/AA (`wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`)  
**Tooling:** `@axe-core/playwright` across Chromium (`apps/web/e2e/accessibility-performance.spec.ts`) + Lighthouse Accessibility (`100 / 100`)

---

## 1. Audited Routes & Themes

| Route | Mode(s) Verified | Resulting Violations |
| --- | --- | --- |
| `/login` | Light Mode | `0` |
| `/dashboard` | Authenticated Admin (Dark Mode) | `0` |
| `/projects` | Authenticated Admin (Dark Mode) | `0` |
| `/users` | Authenticated Admin (Dark Mode) | `0` |
| `/audit` | Authenticated Admin (Dark Mode) | `0` |
| `/reports` | Authenticated Admin (Dark Mode) | `0` |
| `/settings` | Authenticated Admin (Dark Mode) | `0` |

---

## 2. Issues Identified & Remediated

Running automated `@axe-core/playwright` scans across every screen identified 3 real accessibility defects, all resolved prior to final verification:

1. **Insufficient Contrast in Dark Mode (`wcag143` `color-contrast`):**
   - *Finding:* Sidebar section heading `Workspace` and secondary labels in [`DashboardLayout.tsx`](../../apps/web/src/components/layout/DashboardLayout.tsx) used `text-slate-400 dark:text-slate-500` (`#62748e` on `#111827`), measuring `3.72:1` against the required `4.5:1` threshold.
   - *Fix:* Updated sidebar subtitles, section label, and user role label to `text-slate-500 dark:text-slate-400`.
2. **Label-in-Name Mismatch on Sidebar Actions (`wcag253` `label-content-name-mismatch`):**
   - *Finding:* `Logout` button used `aria-label="Sign out"` while displaying `"Logout"`, and the profile button set `aria-label="Open profile and password settings"` overriding visible name and role text.
   - *Fix:* Removed conflicting `aria-label` on `Logout` so visible text and accessible name match directly, and appended `<span className="sr-only">Open profile and password settings</span>` inside the profile button so visible identity text remains part of its accessible name.
3. **Label-in-Name Mismatch on Pagination Controls (`wcag253` `label-content-name-mismatch`):**
   - *Finding:* [`PaginationControls.tsx`](../../apps/web/src/components/PaginationControls.tsx) displayed `"Prev"` / `"Next"` on `sm+` viewports while setting `aria-label="Previous page"` / `"Next page"`.
   - *Fix:* Replaced mismatched `aria-label` attributes with `<span className="sr-only sm:not-sr-only">Prev</span><span className="sr-only"> page</span>` and `<span className="sr-only sm:not-sr-only">Next</span><span className="sr-only"> page</span>`, yielding consistent `"Prev page"` / `"Next page"` accessible names on both mobile and desktop viewports.

---

## 3. Verification Command

```bash
npm run build:web
npm run test:e2e
```
