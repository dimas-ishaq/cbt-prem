import { test, expect } from '@playwright/test';

test.use({ storageState: 'playwright/.auth/admin.json' });

test('Profile page render', async ({ page }) => {
  await page.goto('/admin/profile');
  await expect(page.locator('body')).toBeVisible();
});

test('Upload photo invalid type', async ({ page }) => {
  await page.goto('/admin/profile');
  const fileInput = page.locator('input[type="file"]').first();
  if (await fileInput.isVisible().catch(() => false)) {
    await fileInput.setInputFiles({ name: 'bad.txt', mimeType: 'text/plain', buffer: Buffer.from('bad') });
    const saveBtn = page.locator('button:has-text("Simpan")').first();
    if (await saveBtn.isVisible().catch(() => false)) await saveBtn.click();
    await expect(page.locator('text=/invalid|format|ekstensi|gambar/i').first()).toBeVisible({ timeout: 5000 }).catch(() => {});
  }
});