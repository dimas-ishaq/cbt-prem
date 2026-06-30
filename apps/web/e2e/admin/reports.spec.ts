import { test, expect } from '@playwright/test';

test.use({ storageState: 'playwright/.auth/admin.json' });

test('Reports page render', async ({ page }) => {
  await page.goto('/admin/reports');
  await expect(page.locator('text=Laporan').or(page.locator('text=Report')).first()).toBeVisible();
});

test('Reports exam group detail', async ({ page }) => {
  await page.goto('/admin/reports');
  const groupLink = page.locator('a[href*="/admin/reports/exam-groups/"]').first();
  if (await groupLink.isVisible()) {
    await groupLink.click();
    await page.waitForTimeout(2000);
  }
});
