import { test, expect, Page } from '@playwright/test';

test.use({ storageState: 'playwright/.auth/admin.json' });

const loginAsTeacher = async ({ page }: { page: Page }) => {
  await page.goto('/admin');
};

test('Guru membuat ujian baru', async ({ page }) => {
  await loginAsTeacher({ page });

  // Klik menu Ujian di sidebar
  await page.locator('button').filter({ hasText: /^Ujian$/ }).click();

  // Klik tombol Jadwalkan Ujian
  await page.click('a[href="/admin/exams/create"]');

  // Isi form Informasi Ujian
  await page.fill('input[placeholder="Cth. Ujian Tengah Semester Matematika"]', 'Ujian E2E Playwright');
  await page.fill('textarea[placeholder="Deskripsi opsional..."]', 'Deskripsi Ujian E2E Playwright');

  // Pilih Event Ujian (custom select)
  await page.click('button:has-text("-- Pilih Event Ujian --")');
  await page.click('div[role="option"]:has-text("Test Exam Group")');

  // Pilih Mata Pelajaran (custom select)
  await page.click('button:has-text("Pilih Mata Pelajaran")');
  await page.click('div[role="option"]:has-text("Test Subject")');

  // Atur Waktu
  // Tanggal Mulai (format YYYY-MM-DD)
  await page.getByRole('textbox', { name: 'mm/dd/yyyy' }).first().fill('2026-06-28');
  await page.keyboard.press('Escape');
  
  // Waktu Mulai
  await page.locator('input[type="time"]').first().fill('08:00');

  // Tanggal Berakhir
  await page.getByRole('textbox', { name: 'mm/dd/yyyy' }).last().fill('2026-06-28');
  await page.keyboard.press('Escape');

  // Waktu Berakhir
  await page.locator('input[type="time"]').last().fill('17:00');

  // Target Peserta Ujian
  // Pilih Tingkat Kelas
  await page.locator('select').first().selectOption('X');
  // Pilih Jurusan
  await page.locator('select').last().selectOption({ label: 'Test Major (TEST)' });

  // Klik Rombel Checkbox
  await page.click('label:has-text("Test Rombel")');

  // Pilih Soal
  // Pilih Bank Soal (custom select)
  await page.click('button:has-text("Pilih Bank Soal")');
  await page.click('div[role="option"]:has-text("Test Question Bank")');

  // Klik Pilih Semua soal
  await page.click('button:has-text("Pilih Semua")');

  // Simpan Ujian
  await page.click('button:has-text("Simpan & Buat Ujian")');

  // Cek apakah ujian baru muncul di list
  await expect(page.locator('text=Ujian E2E Playwright')).toBeVisible();
});