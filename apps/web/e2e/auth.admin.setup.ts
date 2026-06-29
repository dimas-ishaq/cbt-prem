import { test as setup, expect } from '@playwright/test';

setup('save admin auth state', async ({ page }) => {
  await page.goto('/login');
  await page.fill('#login-username', process.env.E2E_ADMIN_USERNAME || 'test-teacher');
  await page.fill('#login-password', process.env.E2E_ADMIN_PASSWORD || 'teacher123');
  await page.click('#login-submit');
  await page.waitForURL(/admin/);
  await expect(page).toHaveURL(/admin/);
  await page.context().storageState({ path: 'playwright/.auth/admin.json' });
});
