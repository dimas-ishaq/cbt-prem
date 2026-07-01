import { test, expect } from '@playwright/test';
import { loginViaApi, creds } from '../helpers/auth';

test.describe('RBAC Admin Access', () => {
  test('siswa redirect dari /admin ke /dashboard', async ({ page }) => {
    await loginViaApi(page, creds.student);
    await page.waitForURL(/\/dashboard/, { timeout: 30000 });

    await page.goto('/admin', { waitUntil: 'domcontentloaded' });
    // admin layout useEffect redirect back to /dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 30000 });
  });

  test('siswa redirect dari /admin/results ke /dashboard', async ({ page }) => {
    await loginViaApi(page, creds.student);
    await page.waitForURL(/\/dashboard/, { timeout: 30000 });

    await page.goto('/admin/results', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 30000 });
  });

  test('guru akses /admin valid', async ({ page }) => {
    await loginViaApi(page, creds.teacher);
    await page.waitForURL(/\/admin(\/|$)/, { timeout: 15000 });
    await expect(page).toHaveURL(/\/admin/);
  });

  test('superadmin akses /admin valid', async ({ page }) => {
    await loginViaApi(page, creds.superadmin);
    await page.waitForURL(/\/admin(\/|$)/, { timeout: 15000 });
    await expect(page).toHaveURL(/\/admin/);
  });
});
