import { test, expect } from '@playwright/test';

test.use({ storageState: 'playwright/.auth/admin.json' });

test('Subjects page render', async ({ page }) => {
  await page.goto('/admin/subjects');
  await expect(page.locator('text=Mata').or(page.locator('text=Subject')).first()).toBeVisible();
});

test('Majors page render', async ({ page }) => {
  await page.goto('/admin/majors');
  await expect(page.locator('text=Jurusan').or(page.locator('text=Major')).first()).toBeVisible();
});

test('Rombels page render', async ({ page }) => {
  await page.goto('/admin/rombels');
  await expect(page.locator('text=Rombel').first()).toBeVisible();
});
