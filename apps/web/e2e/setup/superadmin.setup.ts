import { test as setup, expect } from '@playwright/test';
import { login, creds } from '../helpers/auth';

const authFile = 'playwright/.auth/superadmin.json';

setup('save superadmin auth state', async ({ page }) => {
  await login(page, creds.superadmin.username, creds.superadmin.password);
  await expectRedirect(page, /admin/);
  await page.context().storageState({ path: authFile });
});
