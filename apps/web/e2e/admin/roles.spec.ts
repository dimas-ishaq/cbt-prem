import { test, expect } from '@playwright/test';

test.use({ storageState: 'playwright/.auth/admin.json' });

test('roles page renders', async ({ page }) => {
  await page.goto('/admin/roles');
  await expect(page.locator('body')).toBeVisible({ timeout: 10000 });
  await page.waitForLoadState('networkidle');
  await expect(page.locator('text=Peran').or(page.locator('text=Role')).first()).toBeVisible({ timeout: 10000 });
});
