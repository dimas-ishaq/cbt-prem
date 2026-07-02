export const API_URL = process.env.API_URL || 'http://localhost:3001/api';

import { expect, Page } from '@playwright/test';

export async function loginViaApi(page: Page, { username, password }: any, baseURL?: string) {
  const response = await page.request.post(`${API_URL}/auth/login`, {
    data: {
      username,
      password,
    },
  });

  expect(response.status()).toBe(201);
  const data = await response.json();
  expect(data.access_token).toBeDefined();

  await page.goto(baseURL || '/');
  await page.evaluate((token) => {
    localStorage.setItem('auth_token', token);
  }, data.access_token);

  return data;
}