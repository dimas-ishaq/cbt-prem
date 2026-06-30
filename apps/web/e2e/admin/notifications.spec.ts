import { test, expect } from '@playwright/test';

test.use({ storageState: 'playwright/.auth/admin.json' });

test('Notifications page render', async ({ page }) => {
  await page.goto('/admin/notifications');
  await expect(page.locator('text=Notifikasi').or(page.locator('text=Notification')).first()).toBeVisible();
});
