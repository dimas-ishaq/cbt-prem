import { test as setup, expect } from '@playwright/test';
import { login, creds } from '../helpers/auth';

setup('save admin auth state', async ({ page }) => {
  await login(page, creds.teacher.username, creds.teacher.password);
  await page.waitForURL(/\/admin(\/|$)/, { timeout: 15000 });
  await expect(page).toHaveURL(/\/admin/);
  await page.context().storageState({ path: 'playwright/.auth/admin.json' });
});
