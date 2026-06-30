import { test, expect } from '@playwright/test';

test.use({ storageState: 'playwright/.auth/admin.json' });

test('Users page render', async ({ page }) => {
  await page.goto('/admin/users');
  await expect(page.locator('text=Pengguna').or(page.locator('text=User')).first()).toBeVisible();
});
