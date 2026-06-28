import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should display login form', async ({ page }) => {
    await expect(page.locator('#login-username')).toBeVisible();
    await expect(page.locator('#login-password')).toBeVisible();
    await expect(page.locator('#login-submit')).toBeVisible();
  });

  test('should login successfully and redirect to dashboard', async ({ page }) => {
    // Mock API response if needed, or use test user
    await page.fill('input[name="username"]', 'test-student');
    await page.fill('input[name="password"]', 'student123');
    await page.click('button[type="submit"]');

    // Wait for navigation and check dashboard
    await page.waitForURL('/dashboard');
    await expect(page).toHaveURL('/dashboard');
  });
});