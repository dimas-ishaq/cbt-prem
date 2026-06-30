import { test, expect } from '@playwright/test';

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
    await page.click('button:has-text("Riwayat Pengerjaan")');
    await expect(page.getByRole('heading', { name: /riwayat pengerjaan/i })).toBeVisible({ timeout: 15000 });
  });

  test('show server time', async ({ page }) => {
    await expect(page.locator('text=/\\d{2}[.:]\\d{2}[.:]\\d{2}/').first()).toBeVisible();
  });
});