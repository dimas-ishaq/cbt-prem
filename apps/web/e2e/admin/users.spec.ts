import { test, expect } from '@playwright/test';

test.use({ storageState: 'playwright/.auth/admin.json' });

test('users page renders', async ({ page }) => {
  await page.goto('/admin/users');
  await expect(page.locator('body')).toBeVisible({ timeout: 10000 });
  await page.waitForLoadState('networkidle');
  await expect(page.locator('text=Pengguna').or(page.locator('text=User')).first()).toBeVisible({ timeout: 10000 });
});
