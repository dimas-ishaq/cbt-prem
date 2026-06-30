import { test, expect } from '@playwright/test';
import { creds, login, expectRedirect } from '../helpers/auth';

test.describe('Auth Login Smoke', () => {
  test('login siswa sukses', async ({ page }) => {
    await login(page, creds.student.username, creds.student.password);
    await expectRedirect(page, /dashboard/);
    await expect(page.getByText('Portal Siswa').first()).toBeVisible();
  });

  test('login guru sukses', async ({ page }) => {
    await login(page, creds.teacher.username, creds.teacher.password);
    await expectRedirect(page, /admin/);
    await expect(page.getByText('Dashboard').first()).toBeVisible();
  });

  test('login superadmin sukses', async ({ page }) => {
    await login(page, creds.superadmin.username, creds.superadmin.password);
    await expectRedirect(page, /admin/);
    await expect(page.getByText('Dashboard').first()).toBeVisible();
  });

  test('login salah tampil error', async ({ page }) => {
    await login(page, creds.student.username, 'wrong-password');
    await expect(page.getByText(/kredensial tidak valid/i)).toBeVisible({ timeout: 15000 });
  });
});
