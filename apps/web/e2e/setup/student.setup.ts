import { test as setup, expect } from '@playwright/test';
import { login, creds } from '../helpers/auth';

setup('save student auth state', async ({ page }) => {
  await login(page, creds.student.username, creds.student.password);
  await page.waitForURL(/\/dashboard/, { timeout: 15000 });
  await expect(page).toHaveURL(/\/dashboard/);
  await page.context().storageState({ path: 'playwright/.auth/user.json' });
});
