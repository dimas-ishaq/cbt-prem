import { test, expect } from '@playwright/test';

test.use({ storageState: 'playwright/.auth/admin.json' });

test('subjects page renders', async ({ page }) => {
  await page.goto('/admin/subjects');
  await expect(page.locator('text=Mata Pelajaran').or(page.locator('text=Subject')).first()).toBeVisible({ timeout: 10000 });
});

test('majors page renders', async ({ page }) => {
  await page.goto('/admin/majors');
  await expect(page.locator('text=Jurusan').or(page.locator('text=Major')).first()).toBeVisible({ timeout: 10000 });
});

test('rombels page renders', async ({ page }) => {
  await page.goto('/admin/rombels');
  await expect(page.locator('text=Rombel').first()).toBeVisible({ timeout: 10000 });
});
