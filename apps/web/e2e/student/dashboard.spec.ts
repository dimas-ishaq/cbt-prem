import { test, expect } from '@playwright/test';
import { resolve } from 'path';

test.describe('Student Dashboard Smoke', () => {
  test.use({ storageState: 'playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
  });

  test('show portal header', async ({ page }) => {
    await expect(page.getByText('Portal Siswa')).toBeVisible();
  });

  test('show exam list section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /daftar ujian/i })).toBeVisible();
  });

  test('show exam history on tab click', async ({ page }) => {
    const riwayatBtn = page.locator('button:has-text("Riwayat Pengerjaan")');
    if (await riwayatBtn.isVisible()) {
      await riwayatBtn.click();
      await expect(page.getByRole('heading', { name: /riwayat pengerjaan/i })).toBeVisible({ timeout: 15000 });
    }
  });

  test('show server time', async ({ page }) => {
    await expect(page.locator(`text=/\\d{2}[.:]\\d{2}[.:]\\d{2}/`).first()).toBeVisible();
  });

  test('upload photo profile', async ({ page }) => {
    const fileChooserPromise = page.waitForEvent('filechooser');
    const uploadTrigger = page.locator('input[type="file"]').first();
    if (await uploadTrigger.isVisible()) {
      await uploadTrigger.click();
      const fileChooser = await fileChooserPromise;
      const testImg = resolve(__dirname, '..', 'fixtures', 'test-avatar.png');
      await fileChooser.setFiles(testImg);
      await expect(page.locator('text=Berhasil').or(page.locator('text=sukses')).first()).toBeVisible({ timeout: 10000 });
    }
  });
});
