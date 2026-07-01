import { test, expect } from '@playwright/test';

test.use({ storageState: 'playwright/.auth/admin.json' });

test('analytics page renders', async ({ page }) => {
  await page.goto('/admin/results/placeholder/analytics');
  await expect(page.locator('body')).toBeVisible({ timeout: 10000 });
  await page.waitForLoadState('networkidle');
});
