# Automation Test Cases - CBT Premium

Target: tulis semua pengujian dulu, jalankan satu-satu nanti.
Scope: Playwright E2E + API contract minimum.

## Suite 1 - Smoke Auth

### TC-AUTH-001 - Login siswa sukses
Precondition:
- user `siswa1` ada
Steps:
1. Buka `/login`
2. Isi username `siswa1`
3. Isi password `siswa123`
4. Klik submit
Expected:
- redirect ke `/dashboard`
- terlihat teks `Portal Siswa`

### TC-AUTH-002 - Login guru sukses
Precondition:
- user `guru1` ada
Steps:
1. Buka `/login`
2. Isi username `guru1`
3. Isi password `guru123`
4. Klik submit
Expected:
- redirect ke `/admin`
- terlihat dashboard admin

### TC-AUTH-003 - Login superadmin sukses
Precondition:
- user `superadmin1` ada
Steps:
1. Buka `/login`
2. Isi username `superadmin1`
3. Isi password `superadmin123`
4. Klik submit
Expected:
- redirect ke `/admin`
- terlihat dashboard admin

### TC-AUTH-004 - Login salah tampil error
Steps:
1. Buka `/login`
2. Isi username valid
3. Isi password salah
4. Klik submit
Expected:
- tetap di `/login`
- terlihat error login

### TC-AUTH-005 - Logout hapus session
Precondition:
- user login aktif
Steps:
1. Buka dashboard sesuai role
2. Klik logout
Expected:
- redirect ke `/login`
- session hilang

## Suite 2 - RBAC

### TC-RBAC-001 - Siswa block akses admin
Steps:
1. Login sebagai siswa
2. Buka `/admin`
Expected:
- redirect / forbidden / login

### TC-RBAC-002 - Siswa block halaman hasil admin
Steps:
1. Login sebagai siswa
2. Buka `/admin/results/any-id`
Expected:
- akses ditolak

### TC-RBAC-003 - Guru akses admin valid
Steps:
1. Login sebagai guru
2. Buka `/admin`
Expected:
- halaman terbuka

### TC-RBAC-004 - Superadmin akses admin valid
Steps:
1. Login sebagai superadmin
2. Buka `/admin`
Expected:
- halaman terbuka

## Suite 3 - Student Dashboard

### TC-STU-001 - Dashboard render
Steps:
1. Login siswa
2. Buka `/dashboard`
Expected:
- header portal siswa
- daftar ujian muncul

### TC-STU-002 - Riwayat pengerjaan buka
Steps:
1. Login siswa
2. Buka `/dashboard`
3. Klik `Riwayat Pengerjaan`
Expected:
- section riwayat terlihat

### TC-STU-003 - Server time tampil
Steps:
1. Login siswa
2. Buka `/dashboard`
Expected:
- waktu server tampil

### TC-STU-004 - Upload foto profil sukses
Steps:
1. Login siswa
2. Buka dashboard
3. Upload file foto valid
Expected:
- foto profil berubah

## Suite 4 - Exam List

### TC-EXAM-001 - List ujian tampil
Steps:
1. Login siswa
2. Buka `/dashboard` atau `/exams`
Expected:
- list ujian tampil

### TC-EXAM-002 - Filter status ujian
Steps:
1. Login guru
2. Buka `/admin/exams`
3. Pilih status `DRAFT`
Expected:
- list terfilter

### TC-EXAM-003 - Search ujian
Steps:
1. Login guru
2. Buka `/admin/exams`
3. Cari judul ujian
Expected:
- hasil sesuai kata kunci

### TC-EXAM-004 - Delete ujian
Steps:
1. Login guru
2. Buka `/admin/exams`
3. Hapus ujian
Expected:
- ujian hilang dari list

## Suite 5 - Create Exam

### TC-EXAM-CREATE-001 - Form create render
Steps:
1. Login guru
2. Buka `/admin/exams/create`
Expected:
- field judul, deskripsi, subject, group, tanggal, durasi, target, soal terlihat

### TC-EXAM-CREATE-002 - Validasi field wajib
Steps:
1. Buka form create
2. Submit tanpa isi
Expected:
- error field wajib

### TC-EXAM-CREATE-003 - Create exam sukses
Steps:
1. Isi judul
2. Pilih subject
3. Pilih event
4. Isi tanggal mulai/akhir
5. Isi durasi
6. Pilih rombel target
7. Pilih bank soal
8. Pilih soal
9. Submit
Expected:
- redirect ke list ujian
- ujian baru muncul

### TC-EXAM-CREATE-004 - Token generate
Steps:
1. Buka create exam
2. klik generate token
Expected:
- token terisi

### TC-EXAM-CREATE-005 - SEB config conditional
Steps:
1. Aktifkan require SEB
2. Isi config key
Expected:
- payload kirim SEB field

## Suite 6 - Edit Exam

### TC-EXAM-EDIT-001 - Edit exam render
Steps:
1. Login guru
2. Buka `/admin/exams/edit/[id]`
Expected:
- form terisi data lama

### TC-EXAM-EDIT-002 - Update exam sukses
Steps:
1. Ubah title / duration
2. Save
Expected:
- data berubah

## Suite 7 - Exam Session Student

### TC-SES-001 - Buka halaman ujian
Steps:
1. Login siswa
2. Buka `/exams/[id]`
Expected:
- container ujian tampil

### TC-SES-002 - Start session
Steps:
1. Buka ujian aktif
2. Klik start
Expected:
- session masuk in_progress

### TC-SES-003 - Jawab soal pilihan ganda
Steps:
1. Start session
2. Pilih jawaban
3. Next / save
Expected:
- jawaban tersimpan

### TC-SES-004 - Jawab essay
Steps:
1. Start session
2. Isi jawaban essay
3. Save
Expected:
- jawaban tersimpan

### TC-SES-005 - Submit ujian
Steps:
1. Kerjakan beberapa soal
2. Submit
Expected:
- session submitted/finished

### TC-SES-006 - Autosave jalan
Steps:
1. Kerjakan soal
2. Tunggu autosave
Expected:
- progress tidak hilang

### TC-SES-007 - Timer expired auto submit
Steps:
1. Mulai sesi
2. Tunggu sampai waktu habis
Expected:
- auto submit / finish

## Suite 8 - Monitoring

### TC-MON-001 - Monitoring render
Steps:
1. Login guru
2. Buka `/admin/monitoring/[id]`
Expected:
- daftar siswa + progress tampil

### TC-MON-002 - Filter progress
Steps:
1. Buka monitoring
2. Filter `IN_PROGRESS`
Expected:
- list terfilter

### TC-MON-003 - Filter violation
Steps:
1. Buka monitoring
2. Filter `DEVTOOLS`
Expected:
- pelanggaran terfilter

### TC-MON-004 - Search siswa
Steps:
1. Buka monitoring
2. Cari nama siswa
Expected:
- hasil sesuai

### TC-MON-005 - Lock student
Steps:
1. Buka monitoring
2. Klik lock student
Expected:
- socket emit lock_student

### TC-MON-006 - Unlock student
Steps:
1. Buka monitoring
2. Klik unlock student
Expected:
- socket emit unlock_student

## Suite 9 - Results

### TC-RES-001 - Results render
Steps:
1. Login guru
2. Buka `/admin/results/[id]`
Expected:
- tabel hasil tampil

### TC-RES-002 - Filter rombel
Steps:
1. Buka results
2. Pilih rombel
Expected:
- list terfilter

### TC-RES-003 - Filter status
Steps:
1. Buka results
2. Pilih status
Expected:
- list terfilter

### TC-RES-004 - Search hasil
Steps:
1. Ketik nama siswa
Expected:
- list terfilter

### TC-RES-005 - Export xlsx
Steps:
1. Klik export
Expected:
- file xlsx terunduh

### TC-RES-006 - Bulk reset sessions
Steps:
1. Pilih beberapa session
2. Klik bulk reset
3. Konfirmasi
Expected:
- session reset

### TC-RES-007 - Single reset session
Steps:
1. Buka session detail
2. Klik reset
3. Konfirmasi
Expected:
- session reset

## Suite 10 - Reports

### TC-RPT-001 - Reports render
Steps:
1. Login guru
2. Buka `/admin/reports`
Expected:
- page tampil

### TC-RPT-002 - Generate report
Steps:
1. Pilih exam group
2. Generate
Expected:
- laporan dibuat

### TC-RPT-003 - Report exam group detail
Steps:
1. Buka `/admin/reports/exam-groups/[id]`
Expected:
- section report tampil

## Suite 11 - Notifications

### TC-NOTIF-001 - Notification list render
Steps:
1. Login admin
2. Buka `/admin/notifications`
Expected:
- list notifikasi tampil

### TC-NOTIF-002 - Update notification policy
Steps:
1. Buka notification policies
2. Ubah enable/disable
Expected:
- policy tersimpan

## Suite 12 - Settings

### TC-SET-001 - Settings render
Steps:
1. Login admin
2. Buka `/admin/settings`
Expected:
- settings tampil

### TC-SET-002 - Update settings
Steps:
1. Ubah app name / timezone / maintenance mode
2. Simpan
Expected:
- setting berubah

### TC-SET-003 - Notification settings render
Steps:
1. Buka `/admin/settings/notifications`
Expected:
- notification settings tampil

## Suite 13 - Master Data

### TC-MST-001 - Subjects render
### TC-MST-002 - Majors render
### TC-MST-003 - Rombels render
### TC-MST-004 - Users render
### TC-MST-005 - Roles render
Steps common:
1. Login admin
2. Buka page masing-masing
Expected:
- container / table tampil

## Suite 14 - Logs

### TC-LOG-001 - Logs render
Steps:
1. Login admin
2. Buka `/admin/logs`
Expected:
- log list tampil

### TC-LOG-002 - Audit log mutation visible
Steps:
1. Lakukan create/update/delete
2. Buka logs
Expected:
- audit log muncul

## Suite 15 - Profile / Upload

### TC-PROF-001 - Student profile render
Steps:
1. Login siswa
2. Buka profile / dashboard profile section
Expected:
- profile tampil

### TC-PROF-002 - Upload photo invalid type
Steps:
1. Upload file non-image
Expected:
- error validasi

## Suite 16 - API Contract Minimum

### TC-API-001 - GET /settings
Expected:
- 200
- json valid

### TC-API-002 - GET /server-time
Expected:
- 200
- ada serverTime

### TC-API-003 - GET /dashboard/stats
Expected:
- 200
- ada totalStudents, activeExams, avgScore

### TC-API-004 - GET /exams
Expected:
- 200
- list exam valid

### TC-API-005 - GET /exam-sessions/exam/:id
Expected:
- 200
- list session valid

### TC-API-006 - POST /exam-sessions/bulk-reset
Expected:
- 200/201
- session berubah

## Recommended Run Order
1. AUTH
2. RBAC
3. Dashboard
4. Exam list/create/edit
5. Exam session
6. Monitoring
7. Results
8. Reports
9. Notifications
10. Settings
11. Master data
12. Logs
13. API contract

## Notes
- Pakai `data-testid` kalau selector text rapuh.
- Kalau page belum stabil, evaluasi test case dulu, bukan paksa CI.
- Start dari P0 dulu, baru P1, lalu P2.
