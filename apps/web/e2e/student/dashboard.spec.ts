import { test, expect } from '@playwright/test';

test.describe('Student Dashboard Smoke', () => {
  test.use({ storageState: 'playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('show portal header', async ({ page }) => {
    await expect(page.getByText('Portal Siswa')).toBeVisible();
  });

  test('show exam list section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /daftar ujian/i })).toBeVisible({ timeout: 10000 });
  });

  test('show exam history tab', async ({ page }) => {
    const riwayatBtn = page.locator('button:has-text("Riwayat Pengerjaan")');
    await expect(riwayatBtn).toBeVisible({ timeout: 10000 });
    await riwayatBtn.click();
    await expect(page.getByRole('heading', { name: /riwayat pengerjaan/i })).toBeVisible({ timeout: 10000 });
  });

  test('show server time', async ({ page }) => {
    await expect(page.locator(`text=/\\d{2}[.:]\\d{2}[.:]\\d{2}/`).first()).toBeVisible({ timeout: 10000 });
  });
});
