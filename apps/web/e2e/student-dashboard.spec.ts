import { test, expect } from '@playwright/test';

const API_URL = 'http://localhost:3001';

test.describe('Student Dashboard Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="username"]', 'test-student');
    await page.fill('input[name="password"]', 'student123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
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
    // Server time should be displayed (format: "Senin, 01 Jan 2024, 08:00:00" or dot-formatted "08.00.00")
    await expect(page.locator('text=/\\d{2}[.:]\\d{2}[.:]\\d{2}/').first()).toBeVisible();
  });
});