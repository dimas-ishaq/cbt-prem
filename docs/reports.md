# Laporan Audit CBT Premium

**Tanggal:** 2026-06-28  
**Scope:** `apps/api`, `apps/web`, `packages/*`, test, config, struktur repo

## Ringkasan Eksekutif
Status saat ini: **belum layak produksi penuh**.  
Basis fitur sudah lumayan lengkap: auth, role, exam, session, notifikasi, logs, dashboard, web admin/student flow. Tetapi bukti produksi belum kuat. Masih banyak indikator placeholder, test terlalu tipis, dan beberapa konfigurasi berisiko untuk skala sekolah nyata.

Verdict jujur: **siap untuk pilot / beta terbatas**, belum siap untuk seluruh siswa-guru-admin tanpa hardening tambahan.

## Yang Sudah Bagus
- Monorepo rapi: `apps/api`, `apps/web`, `packages/*`.
- Backend pakai NestJS + Prisma + PostgreSQL. Stack masuk akal.
- Ada domain penting: auth, exam, session, roles, logs, notifications, dashboard.
- Frontend Next.js 16 + Chakra UI v3 + React Query + Zustand. Modern dan cukup stabil.
- Ada E2E test, walau masih minim.
- Ada logger, throttling, schedule, websocket, export libs. Fondasi fitur produksi sudah ada.

## Temuan Kritis
### 1) Test coverage belum cukup buat klaim production-ready
Bukti dari repo:
- `apps/api/test/flow.e2e-spec.ts` cuma cek `/health`.
- `apps/web/e2e/login.spec.ts` masih mock-ish dan cuma cek form + redirect.
- Banyak klaim coverage di report lama tidak terbukti dari file yang terlihat.

Dampak:
- Risiko bug regresi tinggi.
- Fitur exam flow, auto-submit, session lock, dan role guard belum tervalidasi kuat.

Rekomendasi:
- Tambah E2E untuk: login, create exam, start session, submit answer, auto-submit, expired session, role access.
- Tambah smoke test per role: siswa, guru, admin.

### 2) Security posture belum final
Bukti:
- `apps/api/src/main.ts` pakai CORS `origin: true`. Itu terlalu longgar buat production.
- `app.module.ts` multer file filter cuma cek mimetype. Belum cukup buat validasi upload aman.
- Ada static serving `/uploads/`. Perlu cek akses file, path traversal, dan auth untuk file sensitif.
- Di schema ada field `plainPassword` pada `User`. Ini red flag besar. Kalau masih dipakai atau terisi, harus dibuang.

Dampak:
- Risiko exposure data, upload abuse, dan origin abuse.

Rekomendasi:
- Set CORS allowlist eksplisit.
- Hapus `plainPassword` bila masih ada di schema / migrasi.
- Tambah guard + audit untuk semua endpoint export, upload, logs, notifications.
- Tambah rate limit per route sensitif, bukan login saja.

### 3) Kesiapan production infra belum jelas
Bukti:
- Banyak dependency infra ada: BullMQ, Redis, Socket.IO, scheduler. Tapi belum terlihat konfigurasi production-hardening yang solid dari artefak yang ada.
- `ScheduleModule.forRoot()` jalan, tapi belum terlihat persistence/locking untuk job penting seperti auto-submit.
- `prisma` pakai engine binary, tapi belum terlihat strategi migrasi, backup, dan health check database.

Dampak:
- Potensi job hilang saat restart.
- Potensi session exam tidak sinkron.

Rekomendasi:
- Pastikan auto-submit, reminder, dan notification critical pakai queue/persistence.
- Tambah health check DB/Redis.
- Tambah backup dan restore runbook.

### 4) Observability masih belum cukup kuat
Bukti:
- Ada logger module, logs module, dashboard module.
- Tidak terlihat bukti tracing, metrics, alerting, atau error budget.

Dampak:
- Saat error di jam ujian, tim sulit root-cause cepat.

Rekomendasi:
- Tambah minimal: structured log, request id, error log, audit log event.
- Tambah metrics dasar: login fail, exam submit fail, session timeout, websocket disconnect.
- Tambah alert untuk error spike dan DB latency.

### 5) Frontend siap pakai, tapi validasi user journey belum penuh
Bukti:
- Route ada: login, dashboard siswa, exam detail, admin panel, monitoring, logs, notifications.
- Tapi test UI masih tipis.

Dampak:
- Bug UX / akses role bisa lolos ke user.

Rekomendasi:
- Tambah Playwright untuk navigasi role-based.
- Pastikan loading/error/empty state semua halaman penting ada.
- Cek aksesibilitas dasar: label, focus, keyboard, kontras.

## Risiko Produksi
| Risiko | Dampak | Level |
|---|---:|---:|
| Test minim | Bug lolos ke siswa saat ujian | Tinggi |
| CORS terlalu longgar | Abuse cross-origin | Tinggi |
| Upload/static asset belum keras | Bocor file / abuse upload | Tinggi |
| Session exam bergantung state runtime | Auto-submit gagal setelah restart | Sedang-Tinggi |
| Observability belum matang | Downtime lama saat incident | Sedang |

## Status Kesiapan per Peran
### Siswa
- Login, dashboard, dan exam flow terlihat ada.
- Tapi belum cukup bukti bahwa session, submit, timeout, dan reconnect stabil.
- **Status:** belum aman full production.

### Guru
- Admin/teacher panel lumayan lengkap.
- CRUD dan monitoring ada.
- Tapi pengujian end-to-end belum cukup.
- **Status:** beta oke, production penuh belum.

### Admin
- Dashboard, logs, notifications, majors, exams, groups ada.
- Namun audit trail dan observability belum cukup.
- **Status:** beta oke, production penuh belum.

## Rekomendasi Prioritas
### P0 - Wajib sebelum production
1. Hapus/cek `plainPassword` dari schema dan semua flow.
2. Ubah CORS dari `origin: true` ke allowlist.
3. Tambah E2E nyata untuk exam flow dan role access.
4. Audit upload + static file access.
5. Pastikan auto-submit/session critical tidak cuma hidup di memory.

### P1 - Sangat disarankan
1. Tambah health check untuk DB/Redis.
2. Tambah structured logging + request id.
3. Tambah rate limit granular.
4. Tambah test untuk permission/guard.
5. Tambah backup/restore SOP.

### P2 - Nice to have
1. Metrics dashboard.
2. Load test 300-500 concurrent user.
3. Offline resilience pada web untuk kondisi jaringan buruk.
4. Anti-cheat tambahan bila memang masuk scope sekolah.

## Kesimpulan Akhir
Repo ini **punya fondasi kuat**, tapi **belum cukup keras untuk disebut production-ready penuh**.  
Kalau targetnya **pilot terbatas**, bisa jalan setelah hardening minimum di P0.  
Kalau targetnya **siswa-guru-admin skala penuh**, belum lolos audit karena test, security, dan infra resilience masih kurang.

**Verdict:** `Beta siap`  
**Production penuh:** `belum`
