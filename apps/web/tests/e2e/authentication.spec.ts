import { test, expect } from '@playwright/test';

test.describe('Authentication Tests', () => {
  test.describe('Login Form', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/login');
    });

    test('should display login form', async ({ page }) => {
      await expect(page.locator('input[type="text"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test('should validate required fields', async ({ page }) => {
      await page.click('button[type="submit"]');
      
      await expect(page.locator('input[type="text"]')).toBeFocused();
    });

    test('should show error with wrong credentials', async ({ page }) => {
      await page.fill('input[type="text"]', 'wronguser');
      await page.fill('input[type="password"]', 'wrongpass');
      await page.click('button[type="submit"]');
      
      await expect(page.locator('text=Gagal login')).toBeVisible();
    });

    test('should login with correct credentials', async ({ page }) => {
      await page.fill('input[type="text"]', 'admin');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      
      await expect(page).toHaveURL(/.*dashboard/);
    });

    test('should show loading state during login', async ({ page }) => {
      await page.fill('input[type="text"]', 'admin');
      await page.fill('input[type="password"]', 'password123');
      
      await page.click('button[type="submit"]');
      
      await expect(page.locator('text=Memproses')).toBeVisible();
    });
  });

  test.describe('Logout', () => {
    test('should logout and redirect to login', async ({ page }) => {
      // Login first
      await page.goto('/login');
      await page.fill('input[type="text"]', 'admin');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/.*dashboard/);
      
      // Logout
      await page.click('text=Keluar');
      await expect(page).toHaveURL(/.*login/);
    });
  });
});