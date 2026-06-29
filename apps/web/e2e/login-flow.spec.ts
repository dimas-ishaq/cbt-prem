import { test, expect } from '@playwright/test';

const CREDS = {
  student: {
    username: process.env.E2E_USERNAME || 'siswa1',
    password: process.env.E2E_PASSWORD || 'siswa123',
    role: 'SISWA',
    expectedURL: /dashboard/,
    expectedText: 'Portal Siswa',
  },
  teacher: {
    username: process.env.E2E_TEACHER_USERNAME || 'guru1',
    password: process.env.E2E_TEACHER_PASSWORD || 'guru123',
    role: 'GURU',
    expectedURL: /admin/,
    expectedText: 'Dashboard',
  },
  superadmin: {
    username: process.env.E2E_SA_USERNAME || 'superadmin1',
    password: process.env.E2E_SA_PASSWORD || 'superadmin123',
    role: 'SUPER_ADMIN',
    expectedURL: /admin/,
    expectedText: 'Dashboard',
  },
};

for (const [label, creds] of Object.entries(CREDS)) {
  test.describe(`Login sebagai ${creds.role} (${label})`, () => {
    test('form render', async ({ page }) => {
      await page.goto('/login');
      await expect(page.getByLabel(/username/i)).toBeVisible();
      await expect(page.getByLabel(/password/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /masuk|login/i })).toBeVisible();
    });

    test('login berhasil redirect ke halaman sesuai role', async ({ page }) => {
      await page.goto('/login');
      await page.fill('#login-username', creds.username);
      await page.fill('input[name="password"]', creds.password);
      await page.click('button[type="submit"]');

      await page.waitForURL(creds.expectedURL);
      await expect(page).toHaveURL(creds.expectedURL);
    });

    test('halaman role menampilkan elemen khas', async ({ page }) => {
      await page.goto('/login');
      await page.fill('#login-username', creds.username);
      await page.fill('input[name="password"]', creds.password);
      await page.click('button[type="submit"]');

      await page.waitForURL(creds.expectedURL);
      await expect(page.getByText(creds.expectedText).first()).toBeVisible();
    });

    test('credential salah tampilkan pesan error', async ({ page }) => {
      await page.goto('/login');
      await page.fill('#login-username', creds.username);
      await page.fill('input[name="password"]', 'wrong-password');
      await page.click('button[type="submit"]');

      await expect(page.getByText(/login gagal|periksa kembali/i)).toBeVisible();
    });
  });
}
