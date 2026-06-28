# Rancangan Pengujian CBT

Dokumen ini berisi langkah uji terperinci sebelum task dicentang.  
Tujuan: pastikan fitur CBT aman, stabil, dan layak dipakai siswa, guru, admin.

## Aturan Umum Pengujian
- Uji di environment staging dulu.
- Pakai data test terpisah.
- Catat browser, device, akun, waktu, dan hasil.
- Kalau hasil gagal 1 kali, ulang 1 kali untuk pastikan flake atau bug.
- Kalau bug berdampak ke ujian, status jadi blocker.
- Jangan centang task sebelum bukti QA lengkap.

## Matriks Peran
| Peran | Fokus Uji |
|---|---|
| Siswa | login, ikut ujian, submit, auto-submit, resume session |
| Guru | buat ujian, atur soal, pantau hasil, export laporan |
| Admin | kelola user, role, log, notifikasi, setting sistem |
| Pengawas | monitor realtime, lock session, lihat violation |
| Super Admin | setting global, integrasi, audit akses |

---

## 1. Pengujian Security Auth & Role

### 1.1 Login sukses dan gagal
**Langkah:**
1. Buka halaman login.
2. Masukkan akun valid per role.
3. Klik masuk.
4. Pastikan redirect ke dashboard sesuai role.
5. Logout.
6. Ulang login pakai password salah 3-5 kali.
7. Catat pesan error dan perilaku lockout bila ada.

**Validasi:**
- user valid masuk sukses
- user invalid ditolak
- sesi logout benar-benar hilang
- cookie/token tidak tetap aktif setelah logout

### 1.2 Akses halaman berdasarkan role
**Langkah:**
1. Login sebagai siswa.
2. Buka halaman admin langsung lewat URL.
3. Buka halaman pengawas langsung lewat URL.
4. Buka halaman guru langsung lewat URL.
5. Ulang langkah yang sama untuk role guru, admin, pengawas.

**Validasi:**
- halaman tak sesuai role harus ditolak / redirect
- tidak ada data bocor
- menu sesuai role saja yang tampil

### 1.3 Audit token dan session
**Langkah:**
1. Login dan buka DevTools.
2. Cek storage/cookie sesuai implementasi.
3. Refresh halaman.
4. Close tab lalu buka ulang.
5. Logout lalu coba akses halaman sebelumnya dengan back button.

**Validasi:**
- session tetap konsisten
- back button tidak membuka data sensitif
- token expired harus memaksa login ulang

---

## 2. Pengujian CORS, Upload, dan Asset

### 2.1 CORS valid dan invalid
**Langkah:**
1. Jalankan frontend dari origin valid.
2. Akses API dan pastikan request berhasil.
3. Jalankan request dari origin palsu / beda domain.
4. Coba fetch API dari origin tak diizinkan.

**Validasi:**
- origin valid lolos
- origin invalid ditolak
- tidak ada response liar yang bisa dipakai cross-site

### 2.2 Upload file aman
**Langkah:**
1. Login sebagai user yang boleh upload.
2. Upload file image valid.
3. Upload file dengan mimetype palsu.
4. Upload file lebih besar dari limit.
5. Upload file nama aneh / extension ganda.

**Validasi:**
- file valid diterima
- file invalid ditolak
- limit size jalan
- error message jelas

### 2.3 Akses static asset
**Langkah:**
1. Upload file.
2. Coba akses file via URL publik.
3. Ulang akses file memakai user role berbeda.
4. Coba akses file pakai path manipulasi.

**Validasi:**
- file sensitif tidak bocor
- path traversal ditolak
- akses sesuai policy

---

## 3. Pengujian Flow Ujian Inti

### 3.1 Siswa ikut ujian dari awal sampai submit
**Langkah:**
1. Login sebagai siswa.
2. Buka dashboard.
3. Masuk halaman detail ujian.
4. Masukkan token bila diperlukan.
5. Start session.
6. Jawab beberapa soal.
7. Simpan jawaban.
8. Submit manual.
9. Cek hasil / status sesi.

**Validasi:**
- session berubah dari not started ke in progress
- jawaban tersimpan
- submit manual menutup sesi
- hasil sesuai data input

### 3.2 Refresh browser saat ujian
**Langkah:**
1. Mulai sesi ujian.
2. Jawab 1-2 soal.
3. Refresh browser.
4. Login ulang bila perlu.
5. Masuk kembali ke sesi yang sama.

**Validasi:**
- progress tidak hilang
- session tetap benar
- user tidak masuk sesi ganda

### 3.3 Reconnect setelah putus koneksi
**Langkah:**
1. Mulai ujian.
2. Matikan internet sebentar.
3. Hidupkan lagi koneksi.
4. Reload halaman.
5. Cek jawaban dan status sesi.

**Validasi:**
- aplikasi pulih
- tidak ada submit ganda
- data tetap konsisten

### 3.4 Auto-submit saat waktu habis
**Langkah:**
1. Mulai ujian dengan durasi pendek di staging.
2. Biarkan timer habis.
3. Jangan klik submit.
4. Tunggu sistem auto-submit.
5. Cek status sesi dan hasil.

**Validasi:**
- sesi auto-submit tepat waktu
- jawaban terakhir tersimpan
- status akhir sesuai aturan

### 3.5 Double submit dan retry
**Langkah:**
1. Klik submit sekali.
2. Klik lagi cepat / spam submit.
3. Simulasikan request ulang dari network retry.

**Validasi:**
- hanya 1 submit diproses
- data tidak duplikat
- response idempotent atau ditolak aman

---

## 4. Pengujian Guru / Admin / Pengawas

### 4.1 Guru buat dan kelola ujian
**Langkah:**
1. Login sebagai guru.
2. Buat ujian baru.
3. Tambah soal.
4. Edit ujian.
5. Publish ujian.
6. Hapus / arsipkan bila fitur ada.

**Validasi:**
- CRUD berjalan
- data konsisten
- validasi form muncul saat input salah

### 4.2 Guru lihat hasil dan export
**Langkah:**
1. Buka halaman hasil ujian.
2. Cek ringkasan nilai.
3. Buka analytics.
4. Export PDF / Excel.
5. Simpan file dan cek isi.

**Validasi:**
- data laporan benar
- export berhasil
- file tidak corrupt
- akses sesuai role

### 4.3 Pengawas monitor realtime
**Langkah:**
1. Login sebagai pengawas.
2. Buka monitoring room.
3. Amati status siswa.
4. Trigger violation jika fitur tersedia.
5. Lock session dari dashboard.

**Validasi:**
- data realtime masuk
- aksi remote berefek
- event tercatat di log

### 4.4 Admin kelola user dan setting
**Langkah:**
1. Login sebagai admin.
2. Buka halaman user / setting / logs.
3. Ubah setting yang diperbolehkan.
4. Cek audit trail.

**Validasi:**
- perubahan tersimpan
- audit log muncul
- akses terbatas sesuai role

---

## 5. Pengujian Notifikasi, Logs, dan Observability

### 5.1 Log aksi penting
**Langkah:**
1. Login.
2. Submit jawaban.
3. Lock session.
4. Export laporan.
5. Ubah setting.

**Validasi:**
- log tercatat
- isi log cukup untuk audit
- ada request id bila sudah diimplementasi

### 5.2 Health check
**Langkah:**
1. Panggil health endpoint.
2. Matikan dependency DB/Redis di staging.
3. Panggil lagi health endpoint.

**Validasi:**
- kondisi sehat terdeteksi
- kondisi rusak terdeteksi
- status tidak bohong

### 5.3 Notifikasi target tepat
**Langkah:**
1. Trigger event notifikasi.
2. Cek recipient yang menerima.
3. Cek user lain yang tidak semestinya menerima.

**Validasi:**
- hanya target benar yang menerima
- prioritas notifikasi benar
- tidak ada duplikasi liar

---

## 6. Pengujian Frontend Stabilitas

### 6.1 Loading, error, empty state
**Langkah:**
1. Buka halaman penting saat API lambat.
2. Putuskan API.
3. Buka halaman dengan data kosong.

**Validasi:**
- loading jelas
- error jelas
- empty state tidak membingungkan

### 6.2 Navigasi role-based
**Langkah:**
1. Login masing-masing role.
2. Klik semua menu yang muncul.
3. Coba buka URL manual ke halaman role lain.

**Validasi:**
- menu sesuai role
- URL manual ditolak bila tidak berhak

### 6.3 Accessibility dasar
**Langkah:**
1. Navigasi pakai keyboard saja.
2. Cek focus visible.
3. Cek label input.
4. Cek kontras teks dan tombol.

**Validasi:**
- semua interaksi utama bisa via keyboard
- label ada
- focus tidak hilang

---

## 7. Pengujian Load dan Kapasitas

### 7.1 Simulasi beban
**Langkah:**
1. Jalankan load test 50 user.
2. Naikkan ke 100.
3. Naikkan ke 300.
4. Jika stabil, coba 500.

**Validasi:**
- latency p95 tercatat
- error rate tidak melonjak
- endpoint kritis tetap responsif

### 7.2 Spike saat jam ujian
**Langkah:**
1. Simulasikan banyak siswa login bersamaan.
2. Simulasikan start ujian bersamaan.
3. Simulasikan submit bersamaan.

**Validasi:**
- DB tidak tumbang
- session tidak kacau
- error rate masih diterima

---

## 8. Pengujian Backup dan Restore

### 8.1 Backup database
**Langkah:**
1. Jalankan proses backup.
2. Simpan hasil backup.
3. Cek ukuran dan timestamp.

**Validasi:**
- backup terbentuk
- file bisa dipakai restore

### 8.2 Restore ke non-production
**Langkah:**
1. Restore backup ke staging / local.
2. Jalankan smoke test.
3. Bandingkan data utama.

**Validasi:**
- restore sukses
- data konsisten
- tidak ada corrupt data

---

## 9. Format Bukti QA
Setiap pengujian wajib punya:
- ID test case
- nama test
- precondition
- langkah uji
- hasil aktual
- expected result
- pass / fail
- severity kalau fail
- screenshot / log / video bila perlu

## 10. Template Test Case
**ID:** CBT-XXX  
**Nama:** Login siswa sukses  
**Precondition:** akun siswa aktif tersedia  
**Langkah:**
1. buka login
2. isi username
3. isi password
4. submit

**Expected:** masuk dashboard siswa  
**Actual:** ...  
**Status:** PASS / FAIL  
**Severity:** ...

## 11. Kriteria Lulus Production
Lulus cuma kalau:
- semua P0 pass
- P1 kritis pass
- test otomatis hijau
- QA manual ada bukti
- tidak ada blocker severity tinggi

Kalau masih ada fail di flow ujian inti, status tetap **belum production ready**.
