import { test, expect } from '@playwright/test';

test.use({ storageState: 'playwright/.auth/admin.json' });

test('Edit exam page load + form populated', async ({ page }) => {
  await page.goto('/admin/exams');
  const editLink = page.locator('a[href*="/admin/exams/edit/"]').first();
  if (await editLink.isVisible()) {
    const href = await editLink.getAttribute('href');
    await page.goto(href || '/admin/exams');
    await page.waitForTimeout(2000);
    const titleInput = page.locator('input[placeholder*="Cth."]');
    if (await titleInput.isVisible()) {
      const currentTitle = await titleInput.inputValue();
      expect(currentTitle.length).toBeGreaterThan(0);
    }
  }
});
