# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: login.spec.ts >> Login Flow >> should login successfully and redirect to dashboard
- Location: e2e\login.spec.ts:14:3

# Error details

```
Test timeout of 90000ms exceeded.
```

```
Error: page.waitForURL: Test timeout of 90000ms exceeded.
=========================== logs ===========================
waiting for navigation to "/dashboard" until "load"
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
              - textbox "Masukkan username Anda" [ref=e105]: test-student
          - group [ref=e106]:
            - generic [ref=e107]: Password
            - generic [ref=e108]:
              - generic:
                - img
              - textbox "Masukkan password Anda" [ref=e109]: student123
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
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Login Flow', () => {
  4  |   test.beforeEach(async ({ page }) => {
  5  |     await page.goto('/login');
  6  |   });
  7  | 
  8  |   test('should display login form', async ({ page }) => {
  9  |     await expect(page.locator('#login-username')).toBeVisible();
  10 |     await expect(page.locator('#login-password')).toBeVisible();
  11 |     await expect(page.locator('#login-submit')).toBeVisible();
  12 |   });
  13 | 
  14 |   test('should login successfully and redirect to dashboard', async ({ page }) => {
  15 |     // Mock API response if needed, or use test user
  16 |     await page.fill('input[name="username"]', 'test-student');
  17 |     await page.fill('input[name="password"]', 'student123');
  18 |     await page.click('button[type="submit"]');
  19 | 
  20 |     // Wait for navigation and check dashboard
> 21 |     await page.waitForURL('/dashboard');
     |                ^ Error: page.waitForURL: Test timeout of 90000ms exceeded.
  22 |     await expect(page).toHaveURL('/dashboard');
  23 |   });
  24 | });
```