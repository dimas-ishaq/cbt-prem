import { test, expect } from '@playwright/test';

test.use({ storageState: 'playwright/.auth/admin.json' });

test('Roles page render', async ({ page }) => {
  await page.goto('/admin/roles');
  await expect(page.locator('text=Peran').or(page.locator('text=Role')).first()).toBeVisible();
});
