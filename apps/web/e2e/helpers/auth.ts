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
  await page.goto('/login', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.getByTestId('login-username').fill(username, { timeout: 30000 });
  await page.getByTestId('login-password').fill(password, { timeout: 30000 });
  await page.getByTestId('login-submit').click({ timeout: 30000 });
}

export async function expectRedirect(page: Page, url: RegExp) {
  await page.waitForURL(url, { timeout: 15000 });
  await expect(page).toHaveURL(url);
}

export async function loginViaApi(page: Page, c: { username: string; password: string }) {
  const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
  const res = await require('node-fetch')(`${baseURL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(c),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`login API fail: ${res.status} ${text}`);
  }
  const { user, access_token, refresh_token } = await res.json();
  await page.goto('/login');
  await page.evaluate(({ user, access_token, refresh_token }) => {
    localStorage.setItem('auth-storage', JSON.stringify({
      state: { user, access_token, refresh_token, hasHydrated: true },
      version: 0,
    }));
  }, { user, access_token, refresh_token });
  await page.reload({ waitUntil: 'networkidle' });
}
