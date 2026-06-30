import { Page, expect } from '@playwright/test';

export const creds = {
  student: {
    username: process.env.E2E_USERNAME || 'siswa1',
    password: process.env.E2E_PASSWORD || 'siswa123',
  },
  teacher: {
    username: process.env.E2E_TEACHER_USERNAME || 'guru1',
    password: process.env.E2E_TEACHER_PASSWORD || 'guru123',
  },
  superadmin: {
    username: process.env.E2E_SA_USERNAME || 'superadmin1',
    password: process.env.E2E_SA_PASSWORD || 'superadmin123',
  },
};

export async function login(page: Page, username: string, password: string) {
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  await page.fill('#login-username', username);
  await page.fill('#login-password', password);
  await page.click('#login-submit');
}

export async function expectRedirect(page: Page, url: RegExp) {
  await page.waitForURL(url, { timeout: 15000 });
  await expect(page).toHaveURL(url);
}
