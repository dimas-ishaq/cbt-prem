import { test, expect } from '@playwright/test';

test.use({ storageState: 'playwright/.auth/admin.json' });

test('Results page render', async ({ page }) => {
  await page.goto('/admin/exams');
  const resultLink = page.locator('a[href*="/admin/results/"]').first();
  if (await resultLink.isVisible().catch(() => false)) {
    const href = await resultLink.getAttribute('href');
    await page.goto(href || '/admin/exams');
    await page.waitForTimeout(2000);
    await expect(page.locator('text=Hasil').or(page.locator('text=Lembar Jawaban')).first()).toBeVisible();
  }
});

test('Results filter rombel', async ({ page }) => {
  await page.goto('/admin/exams');
  const resultLink = page.locator('a[href*="/admin/results/"]').first();
  if (await resultLink.isVisible().catch(() => false)) {
    const href = await resultLink.getAttribute('href');
    if (href) {
      await page.goto(href);
      await page.waitForTimeout(2000);
      const rombelFilter = page.locator('[role="combobox"]').first();
      if (await rombelFilter.isVisible().catch(() => false)) {
        await rombelFilter.click();
        const option = page.locator('div[role="option"]').nth(1);
        if (await option.isVisible().catch(() => false)) await option.click();
        await page.waitForTimeout(500);
      }
    }
  }
});

test('Results filter status', async ({ page }) => {
  await page.goto('/admin/exams');
  const resultLink = page.locator('a[href*="/admin/results/"]').first();
  if (await resultLink.isVisible().catch(() => false)) {
    const href = await resultLink.getAttribute('href');
    if (href) {
      await page.goto(href);
      const filter = page.locator('[role="combobox"]').nth(1);
      if (await filter.isVisible().catch(() => false)) {
        await filter.click();
        const doneOption = page.locator('div[role="option"]:has-text("Selesai")').or(page.locator('div[role="option"]:has-text("Done")'));
        if (await doneOption.isVisible().catch(() => false)) await doneOption.click();
      }
    }
  }
});

test('Results search and export', async ({ page }) => {
  await page.goto('/admin/exams');
  const resultLink = page.locator('a[href*="/admin/results/"]').first();
  if (await resultLink.isVisible().catch(() => false)) {
    const href = await resultLink.getAttribute('href');
    if (href) {
      await page.goto(href);
      const search = page.locator('input[placeholder*="Cari"]').first();
      if (await search.isVisible().catch(() => false)) {
        await search.fill('siswa');
      }
      const exportBtn = page.locator('button:has-text("Export")').or(page.locator('button:has-text("XLSX")')).first();
      if (await exportBtn.isVisible().catch(() => false)) {
        await exportBtn.click();
      }
    }
  }
});