import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { installMockBackend } from './mockBackend';

const PUBLIC_ROUTES = ['/login'];
const PROTECTED_ROUTES = [
  '/dashboard',
  '/projects',
  '/departments',
  '/clients',
  '/employees',
  '/audit',
  '/reports',
];

test.describe('WCAG 2.1 AA Accessibility & Core Web Vitals Audits', () => {
  test('passes Axe accessibility checks on login and across authenticated routes in dark mode', async ({
    page,
  }) => {
    await installMockBackend(page);

    for (const routePath of PUBLIC_ROUTES) {
      await page.goto(routePath);
      await page.waitForLoadState('networkidle');
      const lightResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      expect(
        lightResults.violations,
        `A11y violations on ${routePath}: ${JSON.stringify(lightResults.violations, null, 2)}`,
      ).toEqual([]);
    }

    await installMockBackend(page, { initialRole: 'admin' });
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await page.getByRole('button', { name: 'Theme mode' }).click();
    await page.getByRole('option', { name: 'Dark' }).click();

    for (const routePath of PROTECTED_ROUTES) {
      await page.goto(routePath);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      expect(
        results.violations,
        `A11y violations on ${routePath}: ${JSON.stringify(results.violations, null, 2)}`,
      ).toEqual([]);
    }
  });

  test('records clean Core Web Vitals bounds and avoids eager dashboard chart chunk loading on /login', async ({
    page,
  }) => {
    await installMockBackend(page);

    const requestedUrls: string[] = [];
    page.on('request', (req) => {
      requestedUrls.push(req.url());
    });

    await page.addInitScript(() => {
      (window as unknown as Record<string, unknown>).__cwv = { cls: 0, lcp: 0, fcp: 0 };
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'paint' && entry.name === 'first-contentful-paint') {
            ((window as unknown as Record<string, Record<string, number>>).__cwv).fcp =
              entry.startTime;
          }
        }
      }).observe({ type: 'paint', buffered: true });
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const last = entries[entries.length - 1];
        if (last) {
          ((window as unknown as Record<string, Record<string, number>>).__cwv).lcp =
            last.startTime;
        }
      }).observe({ type: 'largest-contentful-paint', buffered: true });
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as Array<
          PerformanceEntry & { value?: number; hadRecentInput?: boolean }
        >) {
          if (!entry.hadRecentInput && entry.value) {
            ((window as unknown as Record<string, Record<string, number>>).__cwv).cls +=
              entry.value;
          }
        }
      }).observe({ type: 'layout-shift', buffered: true });
    });

    await page.goto('/login');
    await expect(page.getByRole('button', { name: /^login$/i })).toBeVisible();
    await page.waitForTimeout(300);

    const loginCwv = await page.evaluate(() => ({
      cwv: (window as unknown as Record<string, Record<string, number>>).__cwv,
      domNodes: document.querySelectorAll('*').length,
    }));

    expect(loginCwv.cwv.cls).toBeLessThan(0.1);
    expect(loginCwv.cwv.lcp).toBeLessThan(2500);
    expect(requestedUrls.some((url) => url.includes('DashboardPage'))).toBe(false);

    // Measure authenticated dashboard render + lazy chart load
    await installMockBackend(page, { initialRole: 'admin' });
    await page.goto('/dashboard');
    await expect(
      page.getByRole('heading', { name: 'Project & Administration Overview' }),
    ).toBeVisible();
    await page.waitForTimeout(400);

    const dashboardMetrics = await page.evaluate(() => ({
      cwv: (window as unknown as Record<string, Record<string, number>>).__cwv,
      domNodes: document.querySelectorAll('*').length,
    }));

    console.log(
      'CWV_METRICS:',
      JSON.stringify({ login: loginCwv, dashboard: dashboardMetrics }),
    );

    expect(dashboardMetrics.cwv.cls).toBeLessThan(0.1);
    expect(dashboardMetrics.domNodes).toBeLessThan(1500);
    expect(requestedUrls.some((url) => url.includes('DashboardPage'))).toBe(true);
  });
});
