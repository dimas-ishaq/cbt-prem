import { test as setup, expect } from '@playwright/test';

const authFile = 'playwright/.auth/user.json';

setup('save auth state', async ({ page }) => {
  await page.goto('/login');
  await page.fill('#login-username', process.env.E2E_USERNAME || 'test-student');
  await page.fill('#login-password', process.env.E2E_PASSWORD || 'student123');
  await page.click('#login-submit');
  await page.waitForURL(/dashboard/);
  await expect(page).toHaveURL(/dashboard/);
  await page.context().storageState({ path: authFile });
});
