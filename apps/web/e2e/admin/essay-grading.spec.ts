import { test, expect } from '@playwright/test';

test.use({ storageState: 'playwright/.auth/admin.json' });

test('Essay grading page render', async ({ page }) => {
  await page.goto('/admin/results/placeholder/essay-grading');
  await expect(page.locator('body')).toBeVisible();
});
