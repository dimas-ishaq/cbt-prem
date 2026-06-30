import { test, expect } from '@playwright/test';

test.use({ storageState: 'playwright/.auth/admin.json' });

test('Question bank list render', async ({ page }) => {
  await page.goto('/admin/question-banks');
  await expect(page.locator('text=Bank').or(page.locator('text=Soal')).first()).toBeVisible();
});

test('Question bank detail render', async ({ page }) => {
  await page.goto('/admin/question-banks');
  const link = page.locator('a[href*="/admin/question-banks/"]').first();
  if (await link.isVisible()) {
    await link.click();
    await page.waitForTimeout(1500);
  }
});
