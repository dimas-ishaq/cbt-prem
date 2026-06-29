# E2E Testing (Playwright)

Aktifkan pengujian end-to-end untuk flow pengguna dan validasi UI/UX.

## Jalankan

- **Headless (CI, pipeline)**
  ```bash
  pnpm test:e2e
  ```

- **GUI (AI debug / visual QA)**
  ```bash
  HEADLESS=false pnpm test:e2e
  ```

GUI menampilkan browser langsung dengan
- visual assertion snap (misal: screenshot mode)
- interupsi manual (klik, menunggu, pengecekan manual)
- slower eksekusi (`slowMo`) untuk melihat tindakan baris demi baris.

## Spec yang Ada

- `login.spec.ts` – login smoke
- `login-flow.spec.ts` – login siswa / guru / superadmin
- `student-dashboard.spec.ts` – smoke test dashboard siswa

Dua spec sudah mock API minimal dan tetap pada status Anda:
- mendeteksi UI (header, badge, tombol)
- cek status respons

## Manual Mode Tips

1. `HEADLESS=false` memicu UI mode dan set `slowMo` = 150ms.
2. Set env credential kalau perlu:
   - `E2E_USERNAME`
   - `E2E_PASSWORD`
   - `E2E_TEACHER_USERNAME`
   - `E2E_TEACHER_PASSWORD`
   - `E2E_SA_USERNAME`
   - `E2E_SA_PASSWORD`
2. Fokus debugging pada:
  - arah kursor konsol menyeluruh
  - panel network API (tampilan URL)
  - visual assertion (add `.expect().toHaveScreenshot()`)
3. Gunakan breakpoint di Spec untuk pemeriksaan manual (playwright akan berhenti di breakpoint).
4. Simpan screenshot di `test-results/` saat gagal.
5. Verifikasi flow user dengan keberadaan komponen baru:
   - `Ujian Akan Datang` blok pada dashboard siswa
   - Label ketersediaan (`HARI INI` / `SEDANG BERLANGSUNG` / `BELUM MULAI`)
   - Auth loader screen (fallback sebelum redirect login)
6. Setelah memperbarui komponen, jalankan:
   ```bash
   HEADLESS=false pnpm test:e2e
   ```
   lalu:
   - periksa screenshot visual snap untuk perubah UI
   - intervensi manual apa pun (klik, ke tab, target UI)
   - cek log konsol untuk API yang diubah

## Aturan QA

- Tes harus mencakup:
  1. **Mock auth flow** – login dan render
  2. **Render UI fitur baru** – ketersediaan ujian label
  3. **Smoke UI** – visual layout, transisi utama UI/UX
  4. **Lintas mode** – uji mode terarah (light / dark) jika component UI reliance pada tema (tambahan step manual)
  5. **Cek log** – API tidak valid akan muncul di konsol
- Semua spec harus mempertahankan status layar demo yang cocok dengan spec-model pengembang pada situs utama.

## Sprint manual / sprint QA

Disarankan:
1. Pada setiap update komponen UI (exam-list, dashboard page) → jalankan:
2. `pnpm test:e2e`
3. Linters manual & visual memeriksa.

Repositori membentang mock kecil di `/e2e/mocks` jika nantinya Anda butuh interupsi manual.

## Tambahan

Hubungi pada `config/playwright` `headless` definisi dan `slowMo` sama. Edit sesuai kebutuhan (contoh: langkahkan `slowMo` ke 500ms pada link lambat)
