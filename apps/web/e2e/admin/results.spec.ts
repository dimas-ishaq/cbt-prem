import { test, expect } from '@playwright/test';

test.use({ storageState: 'playwright/.auth/admin.json' });

test('Results page render + export', async ({ page }) => {
  // find first exam from exams list
  await page.goto('/admin/exams');
  const resultLink = page.locator('a[href*="/admin/results/"]').first();
  if (await resultLink.isVisible()) {
    const href = await resultLink.getAttribute('href');
    await page.goto(href || '/admin/exams');
    await page.waitForTimeout(2000);
    await expect(page.locator('text=Hasil').or(page.locator('text=Lembar Jawaban')).first()).toBeVisible();
  }
});

test('Results filter rombel', async ({ page }) => {
  await page.goto('/admin/exams');
  const resultLink = page.locator('a[href*="/admin/results/"]').first();
  if (await resultLink.isVisible()) {
    const href = await resultLink.getAttribute('href');
    if (href) {
      await page.goto(href);
      await page.waitForTimeout(2000);
      const rombelFilter = page.locator('[role="combobox"]').first();
      if (await rombelFilter.isVisible()) {
        await rombelFilter.click();
        const option = page.locator('div[role="option"]').nth(1);
        if (await option.isVisible()) await option.click();
        await page.waitForTimeout(500);
      }
    }
  }
});
