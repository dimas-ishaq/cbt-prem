import { test, expect } from '@playwright/test';
import { login, creds } from '../helpers/auth';

test('logout clear session', async ({ page }) => {
  await login(page, creds.teacher.username, creds.teacher.password);
  await page.waitForURL(/admin/, { timeout: 15000 });
  await page.locator('[data-testid="logout-button"]').click({ timeout: 15000 });
  await expect(page).toHaveURL(/login/);
});
