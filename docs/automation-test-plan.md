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

### Auth
- `/login`
- role login: student, teacher, superadmin
- auth redirect by role

### Student
- `/dashboard`
- `/exams`
- `/exams/[id]`

### Teacher / Admin
- `/admin`
- `/admin/exams`
- `/admin/exams/create`
- `/admin/exams/edit/[id]`
- `/admin/exam-groups`
- `/admin/question-banks`
- `/admin/subjects`
- `/admin/majors`
- `/admin/rombels`
- `/admin/users`
- `/admin/roles`
- `/admin/results`
- `/admin/reports`
- `/admin/logs`
- `/admin/notifications`
- `/admin/settings`
- `/admin/monitoring`
- `/admin/sounds`

### API Modules Terlihat
- auth
- dashboard
- exams
- exam-groups
- exam-sessions
- questions
- question-bank
- reports
- realtime
- roles
- students
- teachers
- users
- subjects
- majors
- rombels
- notifications
- audit-log
- settings
- logs

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
- Login smoke already ada
- Role-based login sudah mulai ada
- Auth storage state setup sudah ada
- Student dashboard smoke ada
- Teacher exam create ada

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
- no CI step for web E2E visible in quality gate

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
- active exam group
- subject
- major
- rombel
- question bank
- published exam

### 3. Split suite
- `smoke`: login, dashboard, admin access
- `critical`: exam create, exam session, submit answer
- `regression`: reports, notifications, settings, logs

### 4. Fail-fast gate
PR harus block kalau:
- unit fail
- integration fail
- critical E2E fail
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

## Immediate Next Step
Langkah paling masuk akal:
1. Tambah `data-testid` untuk flow kritis
2. Tambah Playwright spec untuk exam session end-to-end
3. Tambah RBAC negative test
4. Tambah audit-log assertion di API test
5. Hubungkan web E2E ke CI workflow

## Simplifikasi Sadar
- Fokus cuma fitur terlihat dari repo, belum full PRD.
- Belum audit semua page source, jadi matrix ini baseline.
- Next step kalau mau full coverage: scan semua route dan turunkan test case per route.