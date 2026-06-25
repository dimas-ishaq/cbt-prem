import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should display login form', async ({ page }) => {
    await expect(page.getByLabel('Username')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Masuk' })).toBeVisible();
  });

  test('should login successfully and redirect to dashboard', async ({ page }) => {
    // Mock API response if needed, or use test user
    await page.fill('input[name="username"]', 'guru@test.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    // Wait for navigation and check dashboard
    await page.waitForURL(/dashboard/, { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/dashboard/);
  });
});