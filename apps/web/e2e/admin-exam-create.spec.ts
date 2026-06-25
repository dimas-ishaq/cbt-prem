import { test, expect, Page } from '@playwright/test';

const API_URL = 'http://localhost:3001'; // Sesuaikan dengan API backend

const loginAsTeacher = async ({ page }: { page: Page }) => {
  // Login dengan akun guru
  await page.goto('/login');

  await page.fill('input[name="username"]', 'guru@test.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');

  // Tunggu navigasi ke dashboard
  await page.waitForURL(/admin/, { waitUntil: 'networkidle' });
};

const createExam = async ({ page }: { page: Page }) => {
  // Klik menu Eksam di dashboard
  await page.click('a[href="/admin/exams"]');

  // Klik tombol Buat Ujian Baru
  await page.click('button[type="button"]:has-text("Buat Ujian Baru")');

  // Isi form ujian
  await page.fill('input[name="exam-title"]', 'Ujian Test E2E');
  await page.selectOption('select[name="subject"]', 'matematika');  // asumsi ada dropdown subjects

  // Tambahkan soal (misal 2 soal)
  for (let i = 1; i <= 2; i++) {
    await page.click('button[type="button"]:has-text("Tambah Soal")');
    await page.fill(`input[name="question-${i}"]`, `Soal ${i}`);
    await page.fill(`input[name="options-${i}-1"]`, `A
B
C
D`);
  }

  // Atur waktu
  await page.fill('input[name="start-time"]', '09:00');
  await page.fill('input[name="end-time"]', '11:00');

  // Simpan ujian
  await page.click('button[type="button"]:has-text("Simpan")');

  // Tunggu konfirmasi
  await page.waitForSelector('div:has-text("Ujian berhasil dibuat")');
};


test('Guru membuat ujian baru', async ({ page }) => {
  await loginAsTeacher({ page });
  await createExam({ page });
});