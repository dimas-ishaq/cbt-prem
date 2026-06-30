import { test, expect } from '@playwright/test';

test.use({ storageState: 'playwright/.auth/admin.json' });

test('Logs page render', async ({ page }) => {
  await page.goto('/admin/logs');
  await expect(page.locator('text=Log').or(page.locator('text=Aktivitas')).first()).toBeVisible();
});
