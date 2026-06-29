import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should display login form', async ({ page }) => {
    await expect(page.getByLabel(/username/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /masuk|login/i })).toBeVisible();
  });

  test('should login successfully and redirect to dashboard', async ({ page }) => {
    await page.fill('input[name="username"]', process.env.E2E_USERNAME || 'test-student');
    await page.fill('input[name="password"]', process.env.E2E_PASSWORD || 'student123');
    await page.click('button[type="submit"]');

    await page.waitForURL(/dashboard/);
    await expect(page).toHaveURL(/dashboard/);
  });
});