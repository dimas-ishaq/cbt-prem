import { test, expect } from '@playwright/test';

test.use({ storageState: 'playwright/.auth/admin.json' });

test('Sounds page render', async ({ page }) => {
  await page.goto('/admin/sounds');
  await expect(page.locator('body')).toBeVisible();
});
