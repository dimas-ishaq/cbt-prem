import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#login-username', { timeout: 10000 });
  });

  test('should display login form', async ({ page }) => {
    await expect(page.locator('#login-username')).toBeVisible();
    await expect(page.locator('#login-password')).toBeVisible();
    await expect(page.locator('#login-submit')).toBeVisible();
  });

  test('should login successfully and redirect to dashboard', async ({ page }) => {
    await page.waitForSelector('#login-username', { timeout: 10000 });
    await page.fill('#login-username', process.env.E2E_USERNAME || 'siswa1');
    await page.fill('#login-password', process.env.E2E_PASSWORD || 'siswa123');
    await page.click('#login-submit');

    await page.waitForURL(/dashboard/, { timeout: 15000 });
    await expect(page).toHaveURL(/dashboard/);
  });
});