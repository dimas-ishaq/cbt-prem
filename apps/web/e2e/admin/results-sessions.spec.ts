import { test, expect } from '@playwright/test';

test.use({ storageState: 'playwright/.auth/admin.json' });

test('Results session detail render', async ({ page }) => {
  await page.goto('/admin/results/placeholder/sessions/placeholder');
  await expect(page.locator('body')).toBeVisible();
});
