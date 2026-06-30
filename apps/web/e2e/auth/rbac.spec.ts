import { test, expect } from '@playwright/test';

test.describe('RBAC Admin Access', () => {
  test.use({ storageState: 'playwright/.auth/user.json' });

  test('siswa block akses /admin', async ({ page }) => {
    await page.goto('/admin', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    const url = page.url();
    expect(url.includes('/login') || url.includes('/dashboard')).toBeTruthy();
  });
});
