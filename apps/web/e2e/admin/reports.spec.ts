import { test, expect } from '@playwright/test';

test.use({ storageState: 'playwright/.auth/admin.json' });

test('reports page renders', async ({ page }) => {
  await page.goto('/admin/reports');
  await expect(page.locator('body')).toBeVisible({ timeout: 10000 });
  await page.waitForLoadState('networkidle');
  await expect(page.locator('text=Laporan').or(page.locator('text=Report')).first()).toBeVisible({ timeout: 10000 });
});

test('reports exam group detail link is stable', async ({ page }) => {
  await page.goto('/admin/reports');
  const groupLink = page.locator('a[href*="/admin/reports/exam-groups/"]').first();
  if (!(await groupLink.isVisible({ timeout: 5000 }).catch(() => false))) {
    test.skip(true, 'No reports detail link');
    return;
  }
  await groupLink.click();
  await page.waitForLoadState('networkidle');
  await expect(page.locator('body')).toBeVisible();
});
