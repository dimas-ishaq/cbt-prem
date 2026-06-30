import { test, expect } from '@playwright/test';
import { login, creds } from '../helpers/auth';

test.describe('RBAC Admin Access', () => {
  test('siswa block akses /admin', async ({ page }) => {
    await login(page, creds.student.username, creds.student.password);
    await page.waitForURL(/dashboard/, { timeout: 15000 });
    await page.goto('/admin', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    const url = page.url();
    expect(url === 'http://localhost:3000/dashboard' || url === 'http://localhost:3000/login').toBeTruthy();
  });
});
