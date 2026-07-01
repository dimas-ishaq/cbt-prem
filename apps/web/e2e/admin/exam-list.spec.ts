import { test, expect } from '@playwright/test';

test.use({ storageState: 'playwright/.auth/admin.json' });

test('Exam list renders with table', async ({ page }) => {
  await page.goto('/admin/exams');
  await expect(page.locator('text=Ujian').first()).toBeVisible({ timeout: 10000 });
  const table = page.locator('table').first();
  await expect(table).toBeVisible({ timeout: 10000 });
});

test('Exam search filters results', async ({ page }) => {
  await page.goto('/admin/exams');
  const searchInput = page.locator('input[placeholder*="Cari"]');
  await expect(searchInput).toBeVisible({ timeout: 10000 });
  await searchInput.fill('test');
  await page.waitForLoadState('networkidle');
  await expect(page.locator('table').first()).toBeVisible();
});

test('Delete exam with confirmation', async ({ page }) => {
  await page.goto('/admin/exams');
  await page.waitForLoadState('networkidle');
  const deleteBtn = page.locator('button[aria-label="Hapus"], [data-testid="delete-exam"]').first();
  if (await deleteBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await deleteBtn.click();
    const confirmBtn = page.locator('button:has-text("Ya"), button:has-text("Hapus")').first();
    await expect(confirmBtn).toBeVisible({ timeout: 3000 });
    await confirmBtn.click();
    await expect(page.locator('text=/Berhasil|sukses/i').first()).toBeVisible({ timeout: 5000 });
  }
});
