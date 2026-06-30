import { test, expect } from '@playwright/test';

test.use({ storageState: 'playwright/.auth/admin.json' });

test('Profile page render', async ({ page }) => {
  await page.goto('/admin/profile');
  await expect(page.locator('body')).toBeVisible();
});
