import { test, expect } from '@playwright/test';

test.use({ storageState: 'playwright/.auth/admin.json' });

test('logs page renders', async ({ page }) => {
  await page.goto('/admin/logs');
  await expect(page.locator('body')).toBeVisible({ timeout: 10000 });
  await page.waitForLoadState('networkidle');
  await expect(page.locator('text=Log').or(page.locator('text=Aktivitas')).first()).toBeVisible({ timeout: 10000 });
});
