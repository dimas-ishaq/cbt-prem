import { test, expect } from '@playwright/test';

test.use({ storageState: 'playwright/.auth/admin.json' });

test('logout clear session', async ({ page }) => {
  await page.goto('/admin');
  await page.click('button:has-text("Keluar")');
  await expect(page).toHaveURL(/login/);
});
