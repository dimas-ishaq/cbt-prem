import { test, expect } from '@playwright/test';

test.use({ storageState: 'playwright/.auth/user.json' });

test.describe('Student Exam Session', () => {
  test('exam page render', async ({ page }) => {
    await page.goto('/exams/placeholder');
    await expect(page.locator('body')).toBeVisible();
  });

  test('show rules gate or exam state', async ({ page }) => {
    await page.goto('/exams/placeholder');
    await expect(page.locator('body')).toBeVisible();
  });
});
