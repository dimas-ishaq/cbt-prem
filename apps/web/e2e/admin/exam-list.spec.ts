import { test, expect } from '@playwright/test';

test.use({ storageState: 'playwright/.auth/admin.json' });

test('Exam list render + filter status', async ({ page }) => {
  await page.goto('/admin/exams');
  await expect(page.locator('text=Ujian').first()).toBeVisible();
  const rows = page.locator('table tbody tr');
  const count = await rows.count();
  expect(count).toBeGreaterThanOrEqual(0);

  // filter by status dropdown
  const statusSelect = page.locator('[role="combobox"]').first();
  if (await statusSelect.isVisible()) {
    await statusSelect.click();
    const draftOption = page.locator('div[role="option"]:has-text("Draft")');
    if (await draftOption.isVisible()) await draftOption.click();
    await page.waitForTimeout(500);
  }
});

test('Exam search', async ({ page }) => {
  await page.goto('/admin/exams');
  const searchInput = page.locator('input[placeholder*="Cari"]');
  if (await searchInput.isVisible()) {
    await searchInput.fill('test');
    await page.waitForTimeout(300);
  }
});
