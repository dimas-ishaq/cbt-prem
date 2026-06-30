import { test, expect } from '@playwright/test';

test.use({ storageState: 'playwright/.auth/admin.json' });

test('Monitoring history render', async ({ page }) => {
  await page.goto('/admin/monitoring/history');
  await expect(page.locator('body')).toBeVisible();
});
