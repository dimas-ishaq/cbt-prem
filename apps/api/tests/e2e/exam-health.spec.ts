import { playwright, expect } from '@playwright/test';

page.goto('http://localhost:3000/health');

it('should return 200 OK for health endpoint', async () => {
  const response = await page.textContent();
  expect(response).toBe('ok');
});