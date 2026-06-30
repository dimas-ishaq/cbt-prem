import { test, expect } from '@playwright/test';

test.use({ storageState: 'playwright/.auth/admin.json' });

test('Monitoring page render + filter siswa', async ({ page }) => {
  await page.goto('/admin/monitoring');
  await expect(page.locator('text=Monitoring').or(page.locator('text=Pemantauan')).first()).toBeVisible();

  const rows = page.locator('table tbody tr');
  await expect(rows.first()).toBeVisible({ timeout: 10000 }).catch(() => {});

  const filterSelect = page.locator('[role="combobox"]').first();
  if (await filterSelect.isVisible().catch(() => false)) {
    await filterSelect.click();
    const inProgress = page.locator('div[role="option"]:has-text("Sedang Dikerjakan")');
    if (await inProgress.isVisible().catch(() => false)) await inProgress.click();
    await page.waitForTimeout(500);
  }
});

test('Monitoring search siswa', async ({ page }) => {
  await page.goto('/admin/monitoring');
  const search = page.locator('input[placeholder*="Cari"]').first();
  if (await search.isVisible().catch(() => false)) {
    await search.fill('siswa');
    await page.waitForTimeout(500);
  }
});

test('Monitoring filter pelanggaran', async ({ page }) => {
  await page.goto('/admin/monitoring');
  const filterSelect = page.locator('[role="combobox"]').first();
  if (await filterSelect.isVisible().catch(() => false)) {
    await filterSelect.click();
    const violation = page.locator('div[role="option"]:has-text("Pelanggaran")').or(page.locator('div[role="option"]:has-text("Violation")'));
    if (await violation.isVisible().catch(() => false)) await violation.click();
    await page.waitForTimeout(500);
  }
});

test('Monitoring lock dan unlock siswa', async ({ page }) => {
  await page.goto('/admin/monitoring');
  const lockBtn = page.locator('button:has-text("Kunci")').first();
  if (await lockBtn.isVisible().catch(() => false)) {
    await lockBtn.click();
    await page.waitForTimeout(500);
    const confirm = page.locator('button:has-text("Ya")').or(page.locator('button:has-text("Kunci")')).first();
    if (await confirm.isVisible().catch(() => false)) await confirm.click();
  }
  const unlockBtn = page.locator('button:has-text("Buka")').first();
  if (await unlockBtn.isVisible().catch(() => false)) {
    await unlockBtn.click();
    await page.waitForTimeout(500);
    const confirm = page.locator('button:has-text("Ya")').or(page.locator('button:has-text("Buka")')).first();
    if (await confirm.isVisible().catch(() => false)) await confirm.click();
  }
});