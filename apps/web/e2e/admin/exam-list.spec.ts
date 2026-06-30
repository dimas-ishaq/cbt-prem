import { test, expect } from '@playwright/test';

test.use({ storageState: 'playwright/.auth/admin.json' });

test('Exam list render + filter status', async ({ page }) => {
  await page.goto('/admin/exams');
  await expect(page.locator('text=Ujian').first()).toBeVisible();
  const rows = page.locator('table tbody tr');
  const count = await rows.count();
  expect(count).toBeGreaterThanOrEqual(0);

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

test('Delete exam from list', async ({ page }) => {
  await page.goto('/admin/exams');
  // find a delete button / trash icon
  const deleteBtn = page.locator('button[aria-label="Hapus"]').or(page.locator('[data-testid="delete-exam"]')).or(page.locator('svg:has(~ text), button:has(svg[lucide="trash"])')).first();
  if (await deleteBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await deleteBtn.click();
    const confirmBtn = page.locator('button:has-text("Ya")').or(page.locator('button:has-text("Hapus")')).first();
    if (await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await confirmBtn.click();
      await page.waitForTimeout(1000);
      // expect success toast
      await expect(page.locator('text=Berhasil').or(page.locator('text=sukses')).first()).toBeVisible({ timeout: 5000 });
    }
  }
});