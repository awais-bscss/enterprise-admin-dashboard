import { expect, test } from '@playwright/test';
import { E2E_USERS, installMockBackend } from './mockBackend';

test.describe('Authentication, Projects Workspace, and RBAC E2E journey', () => {
  test('enforces auth redirects, project creation for admin, logout, and cross-role RBAC guards for viewer', async ({
    page,
  }) => {
    await installMockBackend(page);

    await page.goto('/settings');
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('button', { name: /^login$/i })).toBeVisible();

    await page.getByLabel('Work email', { exact: true }).fill(E2E_USERS.admin.email);
    await page.getByLabel('Password', { exact: true }).fill('WrongPass1!');
    await page.getByRole('button', { name: /^login$/i }).click();
    await expect(
      page.getByRole('alert').filter({ hasText: 'Invalid email or password' }).first(),
    ).toBeVisible();

    await page.getByLabel('Password', { exact: true }).fill('ValidAdmin99!');
    await page.getByRole('button', { name: /^login$/i }).click();
    await expect(page).toHaveURL(/\/settings$/);
    await expect(page.getByRole('heading', { name: 'System Security Settings' })).toBeVisible();

    await page.getByRole('link', { name: 'Overview', exact: true }).click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(
      page.getByRole('heading', { name: 'Project & Administration Overview' }),
    ).toBeVisible();

    await page.getByRole('link', { name: 'Projects', exact: true }).click();
    await expect(page).toHaveURL(/\/projects$/);
    await expect(page.getByText('Edge CSP Enforcement')).toBeVisible();

    await page.getByRole('button', { name: /new project/i }).click();
    await page.getByLabel('Project Name').fill('Zero Trust Policy Rollout');
    await page.getByLabel('Description').fill('Enforce session rotation across portal edges.');
    await page.getByRole('button', { name: 'Create Project' }).click();
    await expect(page.getByRole('heading', { name: 'Zero Trust Policy Rollout' })).toBeVisible();
    await expect(page.getByText('Created project "Zero Trust Policy Rollout".')).toBeVisible();

    await page.getByRole('button', { name: 'Logout' }).click();
    await expect(page).toHaveURL(/\/login$/);

    await page.goto('/settings');
    await expect(page).toHaveURL(/\/login$/);
    await page.getByLabel('Work email', { exact: true }).fill(E2E_USERS.viewer.email);
    await page.getByLabel('Password', { exact: true }).fill('ValidViewer99!');
    await page.getByRole('button', { name: /^login$/i }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByLabel('Restricted for current role')).toHaveCount(3);

    await page.goto('/settings');
    await expect(page).toHaveURL(/\/unauthorized$/);
    await expect(page.getByRole('heading', { name: 'Access Restricted' })).toBeVisible();

    await page.getByRole('link', { name: 'Back to Overview' }).click();
    await expect(page).toHaveURL(/\/dashboard$/);

    await page.getByRole('link', { name: 'Projects', exact: true }).click();
    await expect(page).toHaveURL(/\/projects$/);
    await expect(page.getByRole('heading', { name: 'Zero Trust Policy Rollout' })).toBeVisible();
    await expect(page.getByRole('button', { name: /new project/i })).toHaveCount(0);
  });
});
