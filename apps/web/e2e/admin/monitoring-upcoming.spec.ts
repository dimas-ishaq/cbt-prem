import { test, expect } from '@playwright/test';

test.use({ storageState: 'playwright/.auth/admin.json' });

test('Monitoring upcoming render', async ({ page }) => {
  await page.goto('/admin/monitoring/upcoming');
  await expect(page.locator('body')).toBeVisible();
});
