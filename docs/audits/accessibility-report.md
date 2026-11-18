# Accessibility Audit Report

Summary of automated WCAG 2.1 Level A / AA checks across the app (`apps/frontend`).

## 1. Automated Verification

- **Tool:** `@axe-core/playwright` (`AxeBuilder` checking `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`)
- **Test file:** `apps/frontend/e2e/accessibility-performance.spec.ts`
- **Command:** `npm run test:e2e`
- **Result:** **0 accessibility violations** on all tested routes.

### Routes Checked

1. `/login` (light mode)
2. `/dashboard` (switched to Dark mode via the theme selector)
3. `/projects`
4. `/departments`
5. `/clients`
6. `/employees`
7. `/audit`
8. `/reports`

## 2. Key Accessibility Practices in the Codebase

- **Keyboard & Focus Management:**
  - Navigation items, table buttons, custom dropdowns (`apps/frontend/src/components/AppDropdown.tsx`), and modals use visible focus outlines and button/option semantics.
  - One primary `<h1>` heading per page so screen readers and Playwright checks have clear landmarks (`aside` sidebar, `<nav>`, main region).
- **Accessible Charts & Tables:**
  - Dashboard SVG charts (`apps/frontend/src/features/dashboard/components/`) expose descriptive `role="img"` / `aria-label` descriptions rather than unlabeled SVG shapes.
  - Interactive status pills, sort headers, and delete confirmation dialogs use descriptive labels.
- **Error & Feedback Announcements:**
  - Login errors and API error banners render inside `role="alert"` (`ErrorAlertBanner.tsx`), verified in both integration and E2E tests.

## 3. Manual Check Checklist Note

Automated Axe checks cover contrast, labels, ARIA attributes, landmarks, and heading hierarchy cleanly (and live Vercel Lighthouse scored **100** in Accessibility). Physical keyboard-only tab walkthroughs and screen-reader spot checks should still be repeated after major modal or table UI changes.
