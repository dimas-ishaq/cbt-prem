import { test, expect } from '@playwright/test';
import { login, creds } from '../helpers/auth';

test.describe('RBAC Admin Access', () => {
  test('siswa block akses /admin', async ({ page }) => {
    await login(page, creds.student.username, creds.student.password);
    await page.waitForURL(/dashboard/, { timeout: 15000 });
    await page.goto('/admin', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    const url = page.url();
    expect(url !== 'http://localhost:3000/admin').toBeTruthy();
  });

  test('siswa block akses /admin/results', async ({ page }) => {
    await login(page, creds.student.username, creds.student.password);
    await page.waitForURL(/dashboard/, { timeout: 15000 });
    await page.goto('/admin/results', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    const url = page.url();
    expect(url !== 'http://localhost:3000/admin/results').toBeTruthy();
  });

  test('guru akses /admin valid', async ({ page }) => {
    await login(page, creds.teacher.username, creds.teacher.password);
    await page.waitForURL(/admin/, { timeout: 15000 });
    await expect(page).toHaveURL(/\/admin/);
  });

  test('superadmin akses /admin valid', async ({ page }) => {
    await login(page, creds.superadmin.username, creds.superadmin.password);
    await page.waitForURL(/admin/, { timeout: 15000 });
    await expect(page).toHaveURL(/\/admin/);
  });
});
