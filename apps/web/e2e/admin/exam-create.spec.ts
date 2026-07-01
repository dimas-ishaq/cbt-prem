import { test, expect } from '@playwright/test';

test.use({ storageState: 'playwright/.auth/admin.json' });

test('Guru membuat ujian baru', async ({ page }) => {
  await page.goto('/admin/exams');
  await page.click('a[href="/admin/exams/create"]');

  await page.fill('input[placeholder="Cth. Ujian Tengah Semester Matematika"]', 'Ujian E2E Playwright');
  await page.fill('textarea[placeholder="Deskripsi opsional..."]', 'Deskripsi Ujian E2E Playwright');

  const eventBtn = page.locator('button:has-text("-- Pilih Event")');
  if (await eventBtn.isVisible()) {
    await eventBtn.click();
    const eventOptions = page.locator('div[role="option"]');
    await expect(eventOptions.first()).toBeVisible({ timeout: 3000 });
    await eventOptions.first().click();
  }

  const subjectBtn = page.locator('button:has-text("Pilih Mata Pelajaran")');
  if (await subjectBtn.isVisible()) {
    await subjectBtn.click();
    const subjectOptions = page.locator('div[role="option"]');
    await expect(subjectOptions.first()).toBeVisible({ timeout: 3000 });
    await subjectOptions.first().click();
  }

  await page.getByRole('textbox', { name: 'mm/dd/yyyy' }).first().fill('2026-06-28');
  await page.keyboard.press('Escape');
  await page.locator('input[type="time"]').first().fill('08:00');

  await page.getByRole('textbox', { name: 'mm/dd/yyyy' }).last().fill('2026-06-28');
  await page.keyboard.press('Escape');
  await page.locator('input[type="time"]').last().fill('17:00');

  await page.locator('input[type="number"]').first().fill('60');

  const selects = page.locator('select');
  const selectCount = await selects.count();
  if (selectCount >= 1) await selects.nth(0).selectOption({ index: 1 });
  if (selectCount >= 2) await selects.nth(1).selectOption({ index: 1 });

  const rombelCheckbox = page.locator('.chakra-checkbox').first();
  if (await rombelCheckbox.isVisible()) await rombelCheckbox.click();

  const bankBtn = page.locator('button:has-text("Pilih Bank Soal")');
  if (await bankBtn.isVisible()) {
    await bankBtn.click();
    const bankOptions = page.locator('div[role="option"]');
    await expect(bankOptions.first()).toBeVisible({ timeout: 3000 });
    await bankOptions.first().click();
  }

  const selectAllBtn = page.locator('button:has-text("Pilih Semua")');
  if (await selectAllBtn.isVisible()) await selectAllBtn.click();

  const submitBtn = page.locator('button:has-text("Simpan & Buat Ujian")');
  await expect(submitBtn).toBeVisible();
  await submitBtn.click();
  await page.waitForURL(/\/admin\/exams/, { timeout: 20000 });
  await expect(page).toHaveURL(/\/admin\/exams/);
});

test('validasi field wajib form create', async ({ page }) => {
  await page.goto('/admin/exams/create');
  const submitBtn = page.locator('button:has-text("Simpan & Buat Ujian")');
  await expect(submitBtn).toBeVisible();
  await submitBtn.click();
  const errorText = page.locator('text=/wajib diisi|harus diisi|tidak boleh kosong/i');
  await expect(errorText.first()).toBeVisible({ timeout: 3000 });
});

test('token generate di form create', async ({ page }) => {
  await page.goto('/admin/exams/create');
  const tokenInput = page.locator('input[placeholder*="Token"]').or(page.locator('[data-testid="exam-token"]'));
  if (await tokenInput.isVisible()) {
    const generateBtn = page.locator('button:has-text("Generate")').or(page.locator('[data-testid="generate-token"]'));
    if (await generateBtn.isVisible()) {
      await generateBtn.click();
      const tokenVal = await tokenInput.inputValue();
      expect(tokenVal.length).toBeGreaterThan(0);
    }
  }
});

test('SEB config toggle', async ({ page }) => {
  await page.goto('/admin/exams/create');
  const sebToggle = page.locator('[role="switch"]').or(page.locator('.chakra-switch')).first();
  if (await sebToggle.isVisible()) {
    await sebToggle.click();
    const sebConfig = page.locator('text=/SEB|Safe Exam Browser|Kunci Browser/i').first();
    if (await sebConfig.isVisible({ timeout: 2000 }).catch(() => false)) {
      const exitKeyInput = page.locator('input[placeholder*="Exit"]').or(page.locator('[data-testid="seb-exit-key"]'));
      if (await exitKeyInput.isVisible()) {
        await exitKeyInput.fill('ctrl+q');
        await expect(exitKeyInput).toHaveValue('ctrl+q');
      }
    }
  }
});
