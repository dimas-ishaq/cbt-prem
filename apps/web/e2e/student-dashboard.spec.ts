import { test, expect } from '@playwright/test';

test.describe('Student Dashboard Smoke Tests', () => {
  test.use({ storageState: 'playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
  });

  test('should display dashboard header', async ({ page }) => {
    await expect(page.getByText('Portal Siswa')).toBeVisible();
  });

  test('should display exam list section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /daftar ujian/i })).toBeVisible();
  });

  test('should display exam history section', async ({ page }) => {
    await page.click('button:has-text("Riwayat Pengerjaan")');
    await expect(page.getByRole('heading', { name: /riwayat pengerjaan/i })).toBeVisible({ timeout: 15000 });
  });

  test('should show server time', async ({ page }) => {
    await expect(page.locator('text=/\\d{2}[.:]\\d{2}[.:]\\d{2}/').first()).toBeVisible();
  });
});