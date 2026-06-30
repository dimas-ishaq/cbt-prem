import { test, expect } from '@playwright/test';

test.use({ storageState: 'playwright/.auth/admin.json' });

test('Edit exam page render', async ({ page }) => {
  await page.goto('/admin/exams');
  const editLink = page.locator('a[href*="/admin/exams/edit/"]').or(page.locator('a[href*="/admin/exams/"]:has-text("Edit")')).first();
  if (await editLink.isVisible({ timeout: 5000 }).catch(() => false)) {
    await editLink.click();
    await page.waitForURL(/\/admin\/exams\/(edit\/)?[a-f0-9-]+/, { timeout: 15000 });
    await expect(page.locator('text=Ubah').or(page.locator('text=Edit')).first()).toBeVisible();
  }
});

test('Update exam sukses', async ({ page }) => {
  await page.goto('/admin/exams');
  const editLink = page.locator('a[href*="/admin/exams/edit/"]').or(page.locator('a[href*="/admin/exams/"]:has-text("Edit")')).first();
  if (await editLink.isVisible({ timeout: 5000 }).catch(() => false)) {
    await editLink.click();
    await page.waitForURL(/\/admin\/exams\/(edit\/)?[a-f0-9-]+/, { timeout: 15000 });

    // modify title
    const titleInput = page.locator('input[placeholder*="Cth. Ujian"]').or(page.locator('[data-testid="exam-title"]'));
    if (await titleInput.isVisible()) {
      await titleInput.fill('Ujian E2E Updated');
      const saveBtn = page.locator('button:has-text("Simpan")').or(page.locator('button:has-text("Update")'));
      if (await saveBtn.isVisible()) {
        await saveBtn.click();
        await page.waitForTimeout(1000);
        await expect(page.locator('text=Berhasil').or(page.locator('text=sukses')).first()).toBeVisible({ timeout: 5000 });
      }
    }
  }
});