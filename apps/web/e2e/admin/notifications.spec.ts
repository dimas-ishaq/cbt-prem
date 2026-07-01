import { test, expect } from '@playwright/test';

test.use({ storageState: 'playwright/.auth/admin.json' });

test('notifications page renders', async ({ page }) => {
  await page.goto('/admin/notifications');
  await expect(page.locator('body')).toBeVisible({ timeout: 10000 });
  await page.waitForLoadState('networkidle');
  await expect(page.locator('text=Notifikasi').or(page.locator('text=Notification')).first()).toBeVisible({ timeout: 10000 });
});
