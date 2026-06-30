# Automation Test Plan - CBT Premium

## Scope
Project stack:
- Frontend: Next.js 16 + React 19 + Chakra UI 3
- Backend: NestJS + Prisma + PostgreSQL
- E2E: Playwright
- Unit/Integration: Jest + Supertest

Repo surface:
- `apps/web` for UI and Playwright specs
- `apps/api` for NestJS services and tests
- `.github/workflows/cbt-quality-gate.yml` for CI gate

## Product Surface Terlihat

### Web routes full scan (from Next.js app router pages)

#### Public/Auth
- `/` - root
- `/login` - login form dengan role-based redirect

#### Student
- `/dashboard` - portal siswa, daftar ujian, riwayat, upload foto profil
- `/exams/[id]` - halaman ujian (ExamContainer)

#### Teacher/Admin
- `/admin` - dashboard: stat total, active exams, avg score, recent exams, live alerts, system health, priority actions
- `/admin/exams` - list ujian + filter status + search + pagination + delete
- `/admin/exams/create` - create ujian (form besar: judul, deskripsi, subject, exam group, tanggal, durasi, status, target rombel, pilih soal, max attempts, SEB config, passing grade, randomize)
- `/admin/exams/edit/[id]` - edit ujian
- `/admin/exam-cards` - kartu ujian (constant + template)
- `/admin/exam-groups` - kelompok ujian
- `/admin/logs` - log aktivitas
- `/admin/majors` - jurusan
- `/admin/monitoring` - daftar ujian dimonitor
- `/admin/monitoring/[id]` - monitoring realtime per ujian: daftar siswa, progress, violation live, socket lock/unlock, search, filter (progress/violation type), fullscreen toggle, auto-refresh
- `/admin/monitoring/history` - riwayat monitoring
- `/admin/monitoring/upcoming` - monitoring akan datang
- `/admin/notifications` - notifikasi
- `/admin/profile`
- `/admin/question-banks` - bank soal (list)
- `/admin/question-banks/[id]` - detail bank soal + isi soal
- `/admin/reports` - laporan
- `/admin/reports/exam-groups/[id]` - report sections + utils
- `/admin/reports/generate/[id]` - generate laporan
- `/admin/results/[id]` - hasil ujian: filter rombel, filter status, search minimal 3 char, pagination, export xlsx, bulk reset (modal konfirmasi), single reset
- `/admin/results/[id]/analytics` - analitik hasil ujian
- `/admin/results/[id]/essay-grading` - koreksi jawaban essay
- `/admin/results/sessions/[id]` - detail sesi ujian
- `/admin/roles` - role & permission
- `/admin/rombels` - rombel
- `/admin/settings` - pengaturan umum
- `/admin/settings/notifications` - notifikasi settings
- `/admin/sounds` - sounds (play, record, upload audio)
- `/admin/subjects` - mata pelajaran
- `/admin/users` - user management (UserContainer)

### API modules full scan (from @Controller decorators)
- `/auth` - login, register, refresh
- `/dashboard` - stats, live alerts
- `/exams` - CRUD exam + scheduler
- `/exam-groups` - CRUD kelompok ujian
- `/exam-sessions` - CRUD sesi, submit answer, grade, bulk-reset, reset, export
- `/questions` - CRUD soal
- `/question-banks` - CRUD bank soal
- `/reports` - generate laporan
- `/notifications` - daftar & manage notifikasi
- `/notifications/policies` - policy role notifikasi
- `/roles` - role & permission CRUD
- `/students` - CRUD siswa
- `/students/profile` - profile siswa (upload foto)
- `/teachers` - CRUD guru
- `/users` - CRUD user
- `/subjects` - CRUD mata pelajaran
- `/majors` - CRUD jurusan
- `/rombels` - CRUD rombel
- `/settings` - CRUD pengaturan (app name, logo, timezone, language, exam defaults, SEB config, maintenance mode dll)
- `/logs` - log aktivitas
- `/uploads` - upload file
- realtime gateway (Socket.io) - monitoring live per exam, violation push, lock/unlock student

### Database model full scan  (45+ relations)
- User, Student, Teacher, Subject, Major, Rombel
- ExamGroup, Exam, ExamQuestion, ExamSession, ExamTargetRombel, ExamTargetMajor
- Question, QuestionOption, Answer, Violation (5 question types)
- QuestionBank
- AuditLog, Notification, NotificationRecipient, NotificationPreference, NotificationRolePolicy
- CustomRole, UserRole, Permission, RolePermission, Menu, SubMenu, RoleAuditLog
- Setting (14 app settings)

## Risiko Utama
1. Auth bypass / redirect salah
2. RBAC bocor: student lihat admin route
3. Exam create/edit salah simpan data
4. Exam session gagal start / submit / timeout
5. Question bank import/template rusak
6. Realtime sync putus saat ujian jalan
7. Report salah agregasi
8. Audit log hilang saat mutation
9. Flaky E2E karena selector rapuh atau data tidak stabil
10. CI hijau palsu karena coverage tidak mewakili flow kritis

## Coverage Target

### P0 must-pass
- login
- logout
- role redirect
- dashboard render
- exam list render
- exam create
- exam edit
- start exam session
- submit answer
- timer / autosave / expiration
- RBAC admin pages
- audit log mutation

### P1
- filter/search/pagination
- notifications
- reports
- monitoring history/upcoming
- question bank import/template
- settings update

### P2
- visual polish
- print/export
- sounds
- minor profile pages
- empty state detail

## Test Pyramid

### Unit - 70%
Target: service, guard, DTO, util.
Minimum:
- auth service
- exams service
- exam-sessions service
- questions import/template service
- reports service
- roles guard
- audit log service

### Integration - 20%
Target: API route + DB + service interaction.
Minimum:
- auth login flow
- exam create/edit flow
- session start/submit flow
- report generation flow

### E2E - 10%
Target: critical user journey only.
Minimum:
- student login -> dashboard -> choose exam -> start exam
- teacher login -> create exam -> verify list
- superadmin login -> admin access -> basic smoke

## Existing Playwright State
Current files:
- `apps/web/e2e/login.spec.ts`
- `apps/web/e2e/login-flow.spec.ts`
- `apps/web/e2e/student-dashboard.spec.ts`
- `apps/web/e2e/admin-exam-create.spec.ts`
- `apps/web/e2e/auth.setup.ts`
- `apps/web/e2e/auth.admin.setup.ts`

Current config:
- `apps/web/playwright.config.ts`
- baseURL: `http://localhost:3000`
- headless toggle via `HEADLESS=false`
- trace on first retry
- screenshot/video on fail

## Coverage Gap Review

### Good
- Login smoke ada
- Role-based login ada
- Auth storage state setup ada
- Student dashboard smoke ada
- Teacher exam create ada
- Admin dashboard page ada
- Monitoring page ada
- Results page ada
- Reports page ada

### Gap
- no logout test
- no negative RBAC test
- no exam session E2E
- no submit answer E2E
- no exam timeout / resume E2E
- no question bank import/template E2E
- no report generation E2E
- no audit-log assertion
- no stable test-id contract documented
- no data seeding contract documented
- no API contract test for `/students/me`, `/server-time`, `/dashboard/stats`, `/exams/:id`, `/exam-sessions/exam/:id`
- no CI step for web E2E visible in quality gate
- broken test file: `apps/api/tests/e2e/exam-health.spec.ts`

## Recommended Automation Strategy

### 1. Stabilize selectors
Wajib pakai:
- `data-testid` untuk button, input, table, card, dialog
- role/label only jika stabil

### 2. Punya test data contract
Wajib seed data tetap:
- student test user
- teacher test user
- superadmin test user
- admin sekolah user
- pengawas user
- active exam group
- subject
- major
- rombel
- question bank
- published exam
- ongoing exam session
- sample violation
- sample notification

### 3. Split suite
- `smoke`: login, dashboard, admin access
- `critical`: exam create, exam session, submit answer
- `regression`: reports, notifications, settings, logs, monitoring
- `api-contract`: auth, dashboard, exam, session, settings

### 4. Fail-fast gate
PR harus block kalau:
- unit fail
- integration fail
- critical E2E fail
- api-contract fail
- typecheck fail
- lint fail
- migration check fail

## Test Matrix Ringkas

| Area | Scenario | Priority | Automation |
|---|---|---:|---|
| Auth | login student success | P0 | Playwright |
| Auth | login teacher success | P0 | Playwright |
| Auth | login superadmin success | P0 | Playwright |
| Auth | invalid credential | P0 | Playwright |
| RBAC | student block admin route | P0 | Playwright |
| Dashboard | student dashboard render | P0 | Playwright |
| Exams | teacher create exam | P0 | Playwright |
| Exams | teacher edit exam | P0 | Playwright |
| Sessions | start exam | P0 | Playwright |
| Sessions | answer question | P0 | Playwright |
| Sessions | submit exam | P0 | Playwright |
| Sessions | timer expired flow | P0 | Playwright |
| Reports | generate report | P1 | Playwright/API |
| Notifications | update policy | P1 | Playwright |
| Question bank | import template | P1 | Playwright |
| Logs | audit log visible | P1 | Playwright/API |

## DoD Production Ready
Tidak boleh release kalau salah satu belum ada:
- smoke pass
- critical E2E pass
- unit/integration pass
- selector stabil
- seed data stabil
- screenshot/trace on fail aktif
- CI gate aktif

## Seed data contract (from `apps/api/prisma/seed.ts`)

| Role | Username | Password |
|---|---|---|
| SISWA | siswa1..siswa25 | siswa123 |
| GURU | guru1..guru8 | guru123 |
| SUPER_ADMIN | superadmin1..superadmin3 | superadmin123 |
| ADMIN_SEKOLAH | admin_sekolah | admin123 |
| PENGAWAS | pengawas1 | pengawas123 |

| Entity | Count | Notes |
|---|---|---|
| Majors | 5 | RPL, TKJ, AKL, MM, HTL |
| Rombels | 15 | 3 per major |
| Subjects | 8 | MTK, BIN, BIG, PPKN, INF, PKK, PAI, SJRH |
| Exam Groups | 5 | mix past/future |
| Question Banks | 9 | 1 per subject |
| Questions | ~44 | mix PG, BS, MR, Essay |
| Settings | 14 | appName, timezone, exam defaults, SEB config, maintenance |

## Test ID contract (RECOMMEND)
Akan ditambah `data-testid` ke flow kritis:
- login: `[data-testid='login-username']`, `[data-testid='login-password']`, `[data-testid='login-submit']`
- student: `[data-testid='student-dashboard']`, `[data-testid='exam-list']`, `[data-testid='exam-history']`
- admin: `[data-testid='admin-dashboard']`, `[data-testid='exam-create-btn']`
- monitoring: `[data-testid='student-progress-list']`, `[data-testid='violation-alert']`
- results: `[data-testid='results-table']`, `[data-testid='export-btn']`, `[data-testid='bulk-reset']`

## Test Matrix Ringkas

| Area | Scenario | Priority | Automation |
|---|---|---|---|
| Auth | login student success | P0 | Playwright |
| Auth | login teacher success | P0 | Playwright |
| Auth | login superadmin success | P0 | Playwright |
| Auth | invalid credential | P0 | Playwright |
| Auth | logout clear session | P0 | Playwright |
| RBAC | student block admin route | P0 | Playwright |
| RBAC | student block teacher-only page | P0 | Playwright |
| Dashboard | student dashboard render | P0 | Playwright |
| Dashboard | admin dashboard render | P0 | Playwright |
| Dashboard | admin dashboard stats > 0 | P1 | Playwright |
| Exams | teacher list exams | P0 | Playwright |
| Exams | teacher create exam | P0 | Playwright |
| Exams | teacher edit exam | P0 | Playwright |
| Exams | teacher delete exam | P1 | Playwright |
| Exam Groups | list exam groups | P1 | Playwright |
| Exam Groups | create exam group | P1 | Playwright |
| Question Banks | list question banks | P1 | Playwright |
| Question Banks | view question bank detail | P1 | Playwright |
| Sessions | start exam session | P0 | Playwright |
| Sessions | answer PG question | P0 | Playwright |
| Sessions | answer essay question | P0 | Playwright |
| Sessions | submit exam | P0 | Playwright |
| Sessions | timer expired flow | P0 | Playwright |
| Monitoring | live monitoring render | P0 | Playwright |
| Monitoring | filter by progress | P1 | Playwright |
| Monitoring | filter by violation type | P1 | Playwright |
| Monitoring | search student | P1 | Playwright |
| Results | view results list | P1 | Playwright |
| Results | filter by rombel | P1 | Playwright |
| Results | filter by status | P1 | Playwright |
| Results | search results | P1 | Playwright |
| Results | export xlsx | P1 | Playwright |
| Results | bulk reset sessions | P2 | Playwright |
| Results | single reset session | P2 | Playwright |
| Reports | generate report | P1 | Playwright |
| Reports | view exam group report | P1 | Playwright |
| Notifications | list notifications | P1 | Playwright |
| Notifications | update policy | P1 | Playwright |
| Settings | view settings | P1 | Playwright |
| Settings | update settings | P1 | Playwright |
| Logs | audit log visible | P1 | Playwright |
| Profile | student profile | P2 | Playwright |
| Profile | upload photo | P2 | Playwright |
| Subjects | CRUD subjects | P1 | Playwright |
| Majors | CRUD majors | P1 | Playwright |
| Rombels | CRUD rombels | P1 | Playwright |
| Users | CRUD users | P1 | Playwright |
| Roles | CRUD roles | P1 | Playwright |
| Sounds | sounds page render | P2 | Playwright |
| Exam Cards | exam cards render | P2 | Playwright |
| Monitoring History | history render | P2 | Playwright |
| Monitoring Upcoming | upcoming render | P2 | Playwright |
| Essay Grading | grading page render | P1 | Playwright |
| Analytics | analytics page render | P2 | Playwright |

## DoD Production Ready
Tidak boleh release kalau salah satu belum ada:
- smoke pass
- critical E2E pass
- unit/integration pass
- selector stabil
- seed data stabil
- screenshot/trace on fail aktif
- CI gate aktif
- broken test dihapus/diperbaiki

## Known Issues
1. `apps/api/tests/e2e/exam-health.spec.ts` - fixed to request-based check, but file still weird because placed in API tree instead of web Playwright tree
2. Playwright config tidak ada `webServer` auto-start
3. Tidak ada `data-testid` di seluruh web app
4. E2E test tidak ada di CI quality gate
5. Some current E2E specs still rely on text/DOM shape, not data-testid

## Coverage Map by Module

### High priority modules
- auth
- exams
- exam-sessions
- dashboard
- question-banks
- reports
- realtime
- settings
- users
- roles
- notifications
- logs

### Medium priority modules
- majors
- rombels
- subjects
- teachers
- students
- uploads

### Low priority modules
- exam-cards
- sounds
- profile
- monitoring history/upcoming
- analytics
- essay grading

## Immediate Next Step
1. Pindah `exam-health.spec.ts` ke tree Playwright yang benar atau hapus dari pipeline
2. Tambah `data-testid` untuk flow kritis
3. Tambah Playwright spec: exam session end-to-end
4. Tambah RBAC negative test
5. Tambah API contract test
6. Hubungkan web E2E ke CI workflow
7. Tambah `webServer` config ke playwright.config.ts
8. Ganti selector rapuh di spec lama bertahap

## Simplifikasi Sadar
- Full scan dari semua page.tsx, controller.ts, dan prisma schema sudah dilakukan.
- Matrix di atas mencakup semua route yang terlihat di codebase.
- Visual/accessibility testing tidak diprioritaskan sampai flow kritis hijau.
- Load testing tidak masuk scope Playwright (pakai k6 terpisah).