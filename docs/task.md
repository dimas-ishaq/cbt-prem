# Rencana Kerja Audit & Hardening CBT

Dokumen ini jadi daftar task eksekusi sebelum status **production full**.  
Aturan ceklis: **jangan centang kalau belum ada bukti test, review, dan verifikasi QA**.

## Prinsip Kerja
- Audit dulu, baru ubah.
- Satu task = satu bukti validasi.
- Semua task kritis harus lolos:
  1. review code
  2. unit test atau E2E
  3. QA audit manual
  4. rerun setelah fix
- Kalau task belum punya bukti, status tetap `[ ]`.

## Urutan Eksekusi
1. Tutup gap security paling berisiko.
2. Kunci flow ujian inti.
3. Perkuat test otomatis.
4. Tambah observability.
5. Baru masuk load test dan production readiness.

---

## P0 — Wajib sebelum production

### 1. Audit security schema dan auth
**Target:** hilang risiko data sensitif dan akses liar.

- `[ ]` Hapus / validasi field sensitif `plainPassword` pada Prisma `User`.
- `[ ]` Audit semua flow auth, login, refresh, logout, role guard.
- `[ ]` Pastikan token, cookie, dan session policy aman untuk production.
- `[ ]` Tambah test untuk akses role: SISWA, GURU, ADMIN_SEKOLAH, PENGAWAS, SUPER_ADMIN.

**Validasi wajib:**
- `[ ]` QA cek tidak ada plain password tersimpan.
- `[ ]` QA cek endpoint role-protected tidak bocor.
- `[ ]` QA cek login fail, lockout, dan logout.

### 2. Kunci CORS dan akses asset
**Target:** cegah abuse cross-origin dan file exposure.

- `[ ]` Ganti `origin: true` jadi allowlist eksplisit di backend.
- `[ ]` Audit akses `/uploads/` dan endpoint file export.
- `[ ]` Validasi upload file image / media dengan check tambahan selain mimetype.
- `[ ]` Tambah test upload invalid, ukuran besar, dan file type liar.

**Validasi wajib:**
- `[ ]` QA uji origin valid dan invalid.
- `[ ]` QA uji file upload aman dan file terblokir.

### 3. Perkuat flow ujian inti
**Target:** exam tidak gagal saat dipakai siswa sungguhan.

- `[ ]` Audit start session, submit answer, auto-submit, expire session, lock session.
- `[ ]` Pastikan flow ujian tidak bergantung state memory saja.
- `[ ]` Pastikan retry submit tidak bikin duplikat data.
- `[ ]` Tambah idempotency / anti double submit bila belum ada.

**Validasi wajib:**
- `[ ]` QA jalankan skenario penuh dari login sampai submit.
- `[ ]` QA simulasi refresh browser, reconnect, dan server restart.
- `[ ]` QA cek auto-submit saat waktu habis.

### 4. Naikkan test otomatis
**Target:** bug dasar ketangkap sebelum QA manual.

- `[ ]` Tambah E2E backend untuk login, exam create, start session, submit answer, expired session.
- `[ ]` Tambah E2E frontend untuk login, dashboard siswa, halaman exam, dashboard guru, dashboard admin.
- `[ ]` Tambah test permission / guard per role.
- `[ ]` Tambah test untuk notifikasi, logs, dan settings kritis.

**Validasi wajib:**
- `[ ]` Semua test jalan di CI.
- `[ ]` Semua test stabil minimal 3x rerun tanpa flake.

---

## P1 — Sangat disarankan

### 5. Observability dan audit trail
**Target:** gampang debug saat jam ujian.

- `[ ]` Pastikan structured log untuk request, error, dan action penting.
- `[ ]` Tambah request id / correlation id.
- `[ ]` Audit logs untuk login, submit, grade, lock session, export.
- `[ ]` Tambah health check DB dan Redis.

**Validasi wajib:**
- `[ ]` QA cek log muncul sesuai aksi.
- `[ ]` QA cek health endpoint fail kalau dependency mati.

### 6. Hardening notifikasi, laporan, dan export
**Target:** modul pendukung aman dan konsisten.

- `[ ]` Audit endpoint export PDF / Excel.
- `[ ]` Audit notification delivery dan recipient access.
- `[ ]` Audit permission report, logs, dan monitoring.
- `[ ]` Tambah test akses unauthorized ke endpoint laporan.

**Validasi wajib:**
- `[ ]` QA cek file export tidak bisa diakses tanpa izin.
- `[ ]` QA cek notif cuma sampai target benar.

### 7. UX stabilitas frontend
**Target:** siswa/guru/admin tidak mentok UI.

- `[ ]` Review loading, error, empty state di halaman penting.
- `[ ]` Pastikan navigasi role-based benar.
- `[ ]` Audit accessibility basic: label, focus, keyboard, contrast.
- `[ ]` Tambah Playwright untuk skenario utama tiap role.

**Validasi wajib:**
- `[ ]` QA cek alur tanpa mouse.
- `[ ]` QA cek tampilan mobile dan desktop.

---

## P2 — Sesudah core aman

### 8. Load test dan capacity check
**Target:** ukur batas nyata.

- `[ ]` Jalankan load test simulasi 300 pengguna.
- `[ ]` Jalankan load test simulasi 500 pengguna.
- `[ ]` Catat latency p95, error rate, dan bottleneck.
- `[ ]` Optimasi query berat dan koneksi DB bila perlu.

**Validasi wajib:**
- `[ ]` QA review hasil load test.
- `[ ]` Tidak ada error spike kritis.

### 9. Backup, restore, dan disaster recovery
**Target:** aman kalau data rusak / server mati.

- `[ ]` Buat SOP backup database.
- `[ ]` Uji restore ke environment non-prod.
- `[ ]` Audit migration plan.
- `[ ]` Pastikan seed/test data tidak campur production.

**Validasi wajib:**
- `[ ]` QA verifikasi restore berhasil.
- `[ ]` QA verifikasi data hasil restore konsisten.

---

## Rencana Kerja Sprint

### Sprint 1 — Security & Auth
Fokus:
- schema sensitif
- CORS
- upload access
- role guard test

Output wajib:
- semua P0 bagian 1 dan 2 selesai
- bukti QA audit security

### Sprint 2 — Exam Core Stability
Fokus:
- session lifecycle
- submit flow
- idempotency
- auto-submit reliability

Output wajib:
- semua P0 bagian 3 selesai
- E2E exam flow hijau

### Sprint 3 — Test Coverage
Fokus:
- backend E2E
- frontend E2E
- permission test
- regression test

Output wajib:
- test suite stabil
- minimal rerun 3x lolos

### Sprint 4 — Observability & Production Readiness
Fokus:
- logs
- health check
- export hardening
- load test

Output wajib:
- QA sign-off
- checklist production review

---

## Permintaan Audit QA

### Instruksi untuk QA
QA harus lakukan audit lengkap berikut:
1. login semua role
2. akses halaman sesuai permission
3. buat ujian
4. mulai sesi ujian
5. jawab soal
6. submit manual
7. tunggu auto-submit / expired session
8. cek hasil, logs, dan export
9. uji error path: invalid token, forbidden, upload salah, origin salah
10. cek mobile, desktop, dan refresh/reconnect behavior

### Output QA yang wajib ada
- daftar bug + severity
- screenshot / bukti langkah uji
- status pass/fail per flow
- rekomendasi blocker production
- keputusan final: **lulus / belum lulus**

### Kriteria ceklis final
Task boleh dicentang hanya kalau:
- code selesai
- test ada
- QA audit selesai
- hasil masuk laporan
- tidak ada blocker severity tinggi

---

## Definition of Done
Satu task dianggap selesai kalau semua ini terpenuhi:
- implementasi sesuai scope
- test otomatis lolos
- QA manual audit lolos
- hasil terdokumentasi
- tidak ada issue open severity tinggi

## Catatan Jujur
Kalau poin P0 belum lolos, **jangan sebut production ready**.  
Kalau test masih minim, itu masih **beta**.
