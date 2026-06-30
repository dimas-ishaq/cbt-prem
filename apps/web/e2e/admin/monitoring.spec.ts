import { test, expect } from '@playwright/test';

test.use({ storageState: 'playwright/.auth/admin.json' });

test('Monitoring page render + filter siswa', async ({ page }) => {
  await page.goto('/admin/monitoring');
  await expect(page.locator('text=Monitoring').or(page.locator('text=Pemantauan')).first()).toBeVisible();

  const monitoringLink = page.locator('a[href*="/admin/monitoring/"]').filter({ hasNot: page.locator('[href$="/monitoring"], [href$="/monitoring/"]') }).first();
  if (await monitoringLink.isVisible()) {
    const href = await monitoringLink.getAttribute('href');
    if (href) {
      await page.goto(href);
      await page.waitForTimeout(3000);
      // filter progress
      const filterSelect = page.locator('[role="combobox"]').first();
      if (await filterSelect.isVisible()) {
        await filterSelect.click();
        const inProgress = page.locator('div[role="option"]:has-text("Sedang Dikerjakan")');
        if (await inProgress.isVisible()) await inProgress.click();
        await page.waitForTimeout(500);
      }
    }
  }
});
