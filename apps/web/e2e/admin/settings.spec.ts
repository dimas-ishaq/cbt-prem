import { test, expect } from '@playwright/test';

test.use({ storageState: 'playwright/.auth/admin.json' });

test('Settings render', async ({ page }) => {
  await page.goto('/admin/settings');
  await expect(page.locator('text=Pengaturan').or(page.locator('text=Settings')).first()).toBeVisible();
});

test('Notifications settings render', async ({ page }) => {
  await page.goto('/admin/settings/notifications');
  await expect(page.locator('text=Notifikasi').or(page.locator('text=Notification')).first()).toBeVisible();
});

test('Update settings', async ({ page }) => {
  await page.goto('/admin/settings');
  const saveBtn = page.locator('button:has-text("Simpan")').first();
  if (await saveBtn.isVisible().catch(() => false)) {
    await saveBtn.click();
    await page.waitForTimeout(1000);
  }
});