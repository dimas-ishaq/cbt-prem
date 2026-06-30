import { test, expect } from '@playwright/test';

test.use({ storageState: 'playwright/.auth/admin.json' });

test('Exam groups page render', async ({ page }) => {
  await page.goto('/admin/exam-groups');
  await expect(page.locator('text=Kelompok').or(page.locator('text=Event')).first()).toBeVisible();
});
