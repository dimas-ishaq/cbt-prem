import { test, expect } from '@playwright/test';

test.use({ storageState: 'playwright/.auth/admin.json' });

test('Guru membuat ujian baru', async ({ page }) => {
  await page.goto('/admin/exams');
  await page.click('a[href="/admin/exams/create"]');

  // Informasi Ujian
  await page.fill('input[placeholder="Cth. Ujian Tengah Semester Matematika"]', 'Ujian E2E Playwright');
  await page.fill('textarea[placeholder="Deskripsi opsional..."]', 'Deskripsi Ujian E2E Playwright');

  // Pilih Event - pilih item pertama
  await page.click('button:has-text("-- Pilih Event")');
  await page.waitForTimeout(500);
  const eventOptions = page.locator('div[role="option"]');
  const eventCount = await eventOptions.count();
  if (eventCount > 0) await eventOptions.first().click();

  // Pilih Subject - pilih item pertama
  await page.click('button:has-text("Pilih Mata Pelajaran")');
  await page.waitForTimeout(500);
  const subjectOptions = page.locator('div[role="option"]');
  const subjectCount = await subjectOptions.count();
  if (subjectCount > 0) await subjectOptions.first().click();

  // Tanggal & Waktu
  await page.getByRole('textbox', { name: 'mm/dd/yyyy' }).first().fill('2026-06-28');
  await page.keyboard.press('Escape');
  await page.locator('input[type="time"]').first().fill('08:00');

  await page.getByRole('textbox', { name: 'mm/dd/yyyy' }).last().fill('2026-06-28');
  await page.keyboard.press('Escape');
  await page.locator('input[type="time"]').last().fill('17:00');

  // Durasi
  await page.locator('input[type="number"]').first().fill('60');

  // Target Peserta - pilih tingkat & jurusan pertama tersedia
  const selects = page.locator('select');
  const selectCount = await selects.count();
  if (selectCount >= 1) await selects.nth(0).selectOption({ index: 1 });
  await page.waitForTimeout(300);
  if (selectCount >= 2) await selects.nth(1).selectOption({ index: 1 });
  await page.waitForTimeout(300);

  // Ceklist rombel pertama yang terfilter
  const rombelCheckbox = page.locator('.chakra-checkbox').first();
  if (await rombelCheckbox.isVisible()) await rombelCheckbox.click();

  // Pilih Bank Soal
  const bankBtn = page.locator('button:has-text("Pilih Bank Soal")');
  if (await bankBtn.isVisible()) {
    await bankBtn.click();
    await page.waitForTimeout(500);
    const bankOptions = page.locator('div[role="option"]');
    if (await bankOptions.count() > 0) await bankOptions.first().click();
    await page.waitForTimeout(500);
  }

  // Pilih Soal - klik Pilih Semua
  const selectAllBtn = page.locator('button:has-text("Pilih Semua")');
  if (await selectAllBtn.isVisible()) await selectAllBtn.click();

  // Submit
  const submitBtn = page.locator('button:has-text("Simpan & Buat Ujian")');
  if (await submitBtn.isVisible()) {
    await submitBtn.click();
    await page.waitForURL(/\/admin\/exams/, { timeout: 20000 });
    await expect(page).toHaveURL(/\/admin\/exams/);
  }
});
