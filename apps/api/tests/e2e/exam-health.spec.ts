import { test, expect } from '@playwright/test';

test('health endpoint ok', async ({ request }) => {
  const response = await request.get('http://localhost:3000/health');
  expect(response.status()).toBe(200);
  await expect(response.text()).resolves.toContain('ok');
});
