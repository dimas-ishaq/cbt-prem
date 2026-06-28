# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin-exam-create.spec.ts >> Guru membuat ujian baru
- Location: e2e\admin-exam-create.spec.ts:11:1

# Error details

```
Test timeout of 90000ms exceeded.
```

```
Error: page.waitForURL: Test timeout of 90000ms exceeded.
=========================== logs ===========================
waiting for navigation until "load"
============================================================
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - generic [ref=e8]:
      - generic [ref=e9]:
        - img [ref=e11]
        - generic [ref=e13]:
          - paragraph [ref=e14]: Novatech CBT
          - paragraph [ref=e15]: Secure Platform
      - generic [ref=e16]:
        - generic [ref=e17]:
          - paragraph [ref=e20]: Platform Ujian Digital Terpercaya
          - heading "Ujian Modern, Terukur & Tepercaya" [level=2] [ref=e21]
        - paragraph [ref=e22]: Sistem CBT berbasis kompetensi dengan teknologi pengawasan mutakhir dan analitik hasil ujian secara instan dan transparan.
        - generic [ref=e23]:
          - generic [ref=e24]:
            - img [ref=e26]
            - generic [ref=e28]:
              - paragraph [ref=e29]: Proctoring Cerdas
              - paragraph [ref=e30]: Deteksi tab switching & pembatasan fokus secara presisi untuk menjamin integritas ujian.
          - generic [ref=e31]:
            - img [ref=e33]
            - generic [ref=e35]:
              - paragraph [ref=e36]: Monitoring Real-time
              - paragraph [ref=e37]: Pengawas memantau status & aktivitas seluruh peserta secara langsung dan terperinci.
          - generic [ref=e38]:
            - img [ref=e40]
            - generic [ref=e43]:
              - paragraph [ref=e44]: Manajemen Waktu Otomatis
              - paragraph [ref=e45]: Timer presisi dengan auto-submit untuk memastikan ujian berjalan sesuai jadwal.
        - generic [ref=e46]:
          - generic [ref=e47]:
            - paragraph [ref=e48]: 10K+
            - paragraph [ref=e49]: Peserta
          - generic [ref=e50]:
            - paragraph [ref=e51]: 99.9%
            - paragraph [ref=e52]: Uptime
          - generic [ref=e53]:
            - paragraph [ref=e54]: < 1s
            - paragraph [ref=e55]: Response
        - generic [ref=e56]:
          - generic [ref=e57]:
            - img [ref=e58]
            - paragraph [ref=e61]: SSL Encrypted
          - generic [ref=e62]:
            - img [ref=e63]
            - paragraph [ref=e66]: ISO 27001
          - generic [ref=e67]:
            - img [ref=e68]
            - paragraph [ref=e71]: Zero-Trust Security
      - paragraph [ref=e72]: © 2026Novatech CBT Platform — Hak Cipta Dilindungi
    - generic [ref=e73]:
      - button "Aktifkan mode gelap" [ref=e77] [cursor=pointer]:
        - img [ref=e78]
      - generic [ref=e83]:
        - generic [ref=e84]:
          - img [ref=e86]
          - heading "Masuk ke Akun Anda" [level=2] [ref=e88]
          - paragraph [ref=e89]: Novatech CBT — Platform Ujian Terpercaya
          - generic [ref=e90]:
            - img [ref=e91]
            - paragraph [ref=e94]: Koneksi Aman & Terenkripsi
        - generic [ref=e95]:
          - img [ref=e97]
          - paragraph [ref=e99]: Login gagal. Periksa kembali username dan password Anda.
        - generic [ref=e101]:
          - group [ref=e102]:
            - generic [ref=e103]: Username
            - generic [ref=e104]:
              - generic:
                - img
              - textbox "Masukkan username Anda" [ref=e105]: test-teacher
          - group [ref=e106]:
            - generic [ref=e107]: Password
            - generic [ref=e108]:
              - generic:
                - img
              - textbox "Masukkan password Anda" [ref=e109]: teacher123
              - button "Tampilkan password" [ref=e111] [cursor=pointer]:
                - img [ref=e112]
          - button "Masuk Sekarang" [ref=e115] [cursor=pointer]:
            - generic [ref=e116]:
              - paragraph [ref=e117]: Masuk Sekarang
              - img [ref=e118]
        - generic [ref=e120]:
          - generic [ref=e121]:
            - paragraph [ref=e124]: SSL
            - paragraph [ref=e127]: AES-256
            - paragraph [ref=e130]: Zero Trust
          - paragraph [ref=e131]: Hubungi administrator jika mengalami kesulitan login.
  - button "Open Next.js Dev Tools" [ref=e137] [cursor=pointer]:
    - img [ref=e138]
  - alert [ref=e141]
  - region "Notifications, top-end (alt+T)"
```

# Test source

```ts
  1  | import { test, expect, Page } from '@playwright/test';
  2  | 
  3  | const loginAsTeacher = async ({ page }: { page: Page }) => {
  4  |   await page.goto('/login');
  5  |   await page.fill('#login-username', 'test-teacher');
  6  |   await page.fill('#login-password', 'teacher123');
  7  |   await page.click('#login-submit');
> 8  |   await page.waitForURL(/admin/);
     |              ^ Error: page.waitForURL: Test timeout of 90000ms exceeded.
  9  | };
  10 | 
  11 | test('Guru membuat ujian baru', async ({ page }) => {
  12 |   await loginAsTeacher({ page });
  13 | 
  14 |   // Klik menu Ujian di sidebar
  15 |   await page.locator('button').filter({ hasText: /^Ujian$/ }).click();
  16 | 
  17 |   // Klik tombol Jadwalkan Ujian
  18 |   await page.click('a[href="/admin/exams/create"]');
  19 | 
  20 |   // Isi form Informasi Ujian
  21 |   await page.fill('input[placeholder="Cth. Ujian Tengah Semester Matematika"]', 'Ujian E2E Playwright');
  22 |   await page.fill('textarea[placeholder="Deskripsi opsional..."]', 'Deskripsi Ujian E2E Playwright');
  23 | 
  24 |   // Pilih Event Ujian (custom select)
  25 |   await page.click('button:has-text("-- Pilih Event Ujian --")');
  26 |   await page.click('div[role="option"]:has-text("Test Exam Group")');
  27 | 
  28 |   // Pilih Mata Pelajaran (custom select)
  29 |   await page.click('button:has-text("Pilih Mata Pelajaran")');
  30 |   await page.click('div[role="option"]:has-text("Test Subject")');
  31 | 
  32 |   // Atur Waktu
  33 |   // Tanggal Mulai (format YYYY-MM-DD)
  34 |   await page.getByRole('textbox', { name: 'mm/dd/yyyy' }).first().fill('2026-06-28');
  35 |   await page.keyboard.press('Escape');
  36 |   
  37 |   // Waktu Mulai
  38 |   await page.locator('input[type="time"]').first().fill('08:00');
  39 | 
  40 |   // Tanggal Berakhir
  41 |   await page.getByRole('textbox', { name: 'mm/dd/yyyy' }).last().fill('2026-06-28');
  42 |   await page.keyboard.press('Escape');
  43 | 
  44 |   // Waktu Berakhir
  45 |   await page.locator('input[type="time"]').last().fill('17:00');
  46 | 
  47 |   // Target Peserta Ujian
  48 |   // Pilih Tingkat Kelas
  49 |   await page.locator('select').first().selectOption('X');
  50 |   // Pilih Jurusan
  51 |   await page.locator('select').last().selectOption({ label: 'Test Major (TEST)' });
  52 | 
  53 |   // Klik Rombel Checkbox
  54 |   await page.click('label:has-text("Test Rombel")');
  55 | 
  56 |   // Pilih Soal
  57 |   // Pilih Bank Soal (custom select)
  58 |   await page.click('button:has-text("Pilih Bank Soal")');
  59 |   await page.click('div[role="option"]:has-text("Test Question Bank")');
  60 | 
  61 |   // Klik Pilih Semua soal
  62 |   await page.click('button:has-text("Pilih Semua")');
  63 | 
  64 |   // Simpan Ujian
  65 |   await page.click('button:has-text("Simpan & Buat Ujian")');
  66 | 
  67 |   // Cek apakah ujian baru muncul di list
  68 |   await expect(page.locator('text=Ujian E2E Playwright')).toBeVisible();
  69 | });
```