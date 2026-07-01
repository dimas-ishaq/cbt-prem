import { test, expect } from '@playwright/test';

test.use({ storageState: 'playwright/.auth/admin.json' });

test('exam cards page renders', async ({ page }) => {
  await page.goto('/admin/exam-cards');
  await expect(page.locator('body')).toBeVisible({ timeout: 10000 });
  await page.waitForLoadState('networkidle');
  const heading = page.locator('text=/Kartu|Kartu Peserta|Exam Card/i').first();
  await expect(heading).toBeVisible({ timeout: 10000 });
});
