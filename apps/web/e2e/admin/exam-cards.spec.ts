import { test, expect } from '@playwright/test';

test.use({ storageState: 'playwright/.auth/admin.json' });

test('Exam cards page render', async ({ page }) => {
  await page.goto('/admin/exam-cards');
  await expect(page.locator('body')).toBeVisible();
});
