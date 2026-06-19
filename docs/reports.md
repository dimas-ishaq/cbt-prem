# 🏢 CBT Premium Enterprise — Audit Report

**Project:** CBT Premium Enterprise API & Web  
**Branch:** `main`  
**Audit Date:** 2026-06-19  
**Last Updated:** 2026-06-19 (fixes applied)  
**Auditor:** Internal Code Audit  
**Scope:** Entire backend (`apps/api`) + root configuration  

---

## 1. Executive Summary

| Metric | Status |
|:---|:---|
| **Overall Health** | ⚠️ CONDITIONAL PASS |
| **Critical Risks** | 2 items (⬇️ dari 4) |
| **High Risks** | 4 items (⬇️ dari 6) |
| **Medium Risks** | 7 items |
| **Low Risks** | 5 items |
| **Test Coverage** | ~22% |
| **Security Posture** | ⚠️ NEEDS ATTENTION (⬆️ improved) |
| **DevOps Readiness** | ⚠️ PARTIAL (⬆️ improved) |

**Verdict:** Aplikasi sudah memiliki fitur inti CBT yang lengkap. Beberapa critical security issues sudah diperbaiki, tetapi masih ada risiko production yang perlu ditangani sebelum go-live.

### Perbaikan yang Sudah Dilakukan Hari Ini

| # | Task | Status |
|:---|:---|:---:|
| 1 | Hapus `default-secret` JWT — enforce env var required | ✅ **FIXED** |
| 2 | Ganti hardcoded password teacher dengan random `crypto.randomBytes` | ✅ **FIXED** |
| 3 | Ganti hardcoded password di `importUsers` dengan random | ✅ **FIXED** |
| 4 | Proteksi `GET /settings` dengan JWT + Role SUPER_ADMIN | ✅ **FIXED** |
| 5 | Bungkus `submitAnswer` dalam `$transaction` | ✅ **FIXED** |
| 6 | Tambah `@nestjs/throttler` + rate limit 5 req/menit di `/auth/login` | ✅ **FIXED** |
| 7 | Buat `apps/api/.env.example` dengan semua variabel environment | ✅ **FIXED** |
| 8 | Isi `apps/api/.env` dengan konfigurasi development | ✅ **FIXED** |

---

## 2. Architecture Overview

### 2.1 Tech Stack

| Layer | Technology |
|:---|:---|
| **Runtime** | Node.js (NestJS 11) |
| **Language** | TypeScript |
| **ORM** | Prisma 7 + PostgreSQL |
| **Auth** | Passport JWT + custom RBAC + Throttler |
| **Realtime** | Socket.IO (NestJS WebSocket Gateway) |
| **Queue** | BullMQ (dependency installed, no worker usage found) |
| **Export** | ExcelJS, docx (Word template) |
| **Logging** | Winston + DailyRotateFile |
| **Build Tool** | Turborepo monorepo |
| **Dev Readiness** | `npm run start:prod`, Prisma seed, Docker Compose (DB + Redis only) |

### 2.2 Directory Structure (Relevant)

```
G:/Project/Javascript/cbt-prem/
├── apps/
│   ├── api/                    ← NestJS backend (audit focus)
│   │   ├── src/
│   │   │   ├── auth/           ← JWT login/refresh/protected routes + rate limit
│   │   │   ├── exams/          ← Exam CRUD + SEB validation
│   │   │   ├── exam-sessions/  ← Start/submit/finish + auto-grading (atomic)
│   │   │   ├── exam-groups/    ← Exam grouping
│   │   │   ├── questions/      ← Question CRUD + DOCX import
│   │   │   ├── question-bank/
│   │   │   ├── students/
│   │   │   ├── teachers/
│   │   │   ├── users/
│   │   │   ├── majors/
│   │   │   ├── rombels/
│   │   │   ├── subjects/
│   │   │   ├── roles/          ← RBAC role & permission manager
│   │   │   ├── settings/       ← App settings (protected)
│   │   │   ├── logs/           ← Log file browser
│   │   │   ├── reports/        ← Report catalog (placeholder URLs)
│   │   │   ├── realtime/       ← Socket.IO gateway (JWT handshake)
│   │   │   ├── common/logger/  ← Winston logger
│   │   │   └── prisma/         ← Prisma service + slow query warning
│   │   └── prisma/
│   │       ├── schema.prisma   ← Full schema (30+ models)
│   │       └── seed.ts         ← Comprehensive seeder
│   └── web/                    ← Frontend (not audited in depth)
├── docs/
├── docker-compose.yml          ← PostgreSQL + Redis only
├── README.md                   ← Generic Turborepo template (stale)
└── package.json                ← Root monorepo
```

### 2.3 Database Models (Inventory from `schema.prisma`)

| Model | Purpose | Audit Notes |
|:---|:---|:---|
| `User` | Auth identity (role enum) | Default-only roles in enum; temp passwords now random |
| `Teacher` | User → Teacher profile | Password no longer hardcoded |
| `Student` | User → Student profile | |
| `Subject` | Mata pelajaran | |
| `Major` | Jurusan | |
| `Rombel` | Kelas/rombel | |
| `QuestionBank` | Bank soal | Ownership check incomplete in update/delete |
| `Question` | Soal (4 tipe) | |
| `QuestionOption` | Opsi jawaban | |
| `Exam` | Ujian (SEB config, randomize settings) | |
| `ExamGroup` | Kelompok ujian | |
| `ExamSession` | Sesi ujian siswa | No ownership check; no server timeout |
| `ExamQuestion` | Pivot exam ↔ question | |
| `Answer` | Jawaban siswa | `isCorrect` nullable; submit now atomic |
| `Violation` | Anti-cheat log | Only created via WebSocket; no server-side enforcement |
| `CustomRole` | Custom RBAC role | Audit log present for role mutations |
| `RolePermission` | Role ↔ Permission pivot | |
| `UserRole` | User ↔ Role pivot | A user can have multiple roles |
| `Permission` | Granular action perms | |
| `Menu` / `SubMenu` | Navigation structure | |
| `Setting` | App config | GET/POST now protected with JWT + SUPER_ADMIN |
| `AuditLog` | Generic audit trail (model exists, **never emitted**) | |
| `RoleAuditLog` | Role change audit | Properly used in `RolesService` |
| `Notification` | Notification model | `RealtimeService` is empty |

---

## 3. Module-by-Module Assessment

### 3.1 Auth Module (`auth/`)
| Aspect | Status | Evidence |
|:---|:---:|:---|
| Login flow | ✅ PASS | `validateUser` + `bcrypt.compare` implemented |
| JWT generation | ⚠️ WARN | `refreshSecret`/`refreshExpiresIn` from env, **no validation** |
| JWT verification | ✅ PASS | `|| 'default-secret'` removed; throws if env missing |
| JWT `sub` claim | ✅ PASS | Returns `userId` |
| RBAC | ⚠️ PARTIAL | `RolesGuard` and `PermissionsGuard` exist and used |
| Rate limiting | ✅ PASS | ThrottlerGuard pada `/auth/login` (5 req/menit) |
| Logout/revocation | 🔴 FAIL | Not implemented — token remains valid until expiry |
| Refresh token | ⚠️ WARN | No blacklist/rotation mechanism |

### 3.2 Users Module (`users/`)
| Aspect | Status | Evidence |
|:---|:---:|:---|
| Admin CRUD | ✅ PASS | Full CRUD with role guards |
| CSV export | ✅ PASS | `exportAllUsers` implemented |
| CSV import | ⚠️ PARTIAL | Default password sekarang random via `crypto.randomBytes` |
| Password hashing | ✅ PASS | `bcryptjs`, default password sekarang random |
| Delete guard | ✅ PASS | Cannot delete last SUPER_ADMIN |
| Idempotency | 🔴 FAIL | `importUsers` has no idempotency key; duplicate imports create duplicates |

### 3.3 Students Module (`students/`)
| Aspect | Status | Evidence |
|:---|---:|:---|
| Random password | ✅ PASS | `crypto.randomBytes(12)` generates secure temp password |
| School admin RBAC | ✅ PASS | `@Roles(SUPER_ADMIN, ADMIN_SEKOLAH)` |
| Student self-profile | ✅ PASS | `/students/me` endpoint exists |
| Ownership check start | 🔴 FAIL | `startSession` allows START for any student; no check if exam belongs to student's class/subject |
| Import/export | 🔴 FAIL | No bulk import/export for students yet |

### 3.4 Teachers Module (`teachers/`)
| Aspect | Status | Evidence |
|:---|:---:|:---|
| CRUD | ✅ PASS | `create`, `findAll`, `remove` |
| Hardcoded password | ✅ PASS | **FIXED** — sekarang menggunakan `crypto.randomBytes(12)` |
| RBAC | ✅ PASS | `@Roles(SUPER_ADMIN, ADMIN_SEKOLAH)` |

### 3.5 Exams Module (`exams/`)
| Aspect | Status | Evidence |
|:---|:---:|:---|
| CRUD | ✅ PASS | Full CRUD with teacher RBAC |
| SEB validation | ⚠️ PARTIAL | `isSebAllowed` implemented but commented-out SEB enforcement in controller |
| Shuffle | ✅ PASS | Seeded shuffle via deterministic RNG |
| Soft delete / cascade | ✅ PASS | `$transaction` deletes answers/sessions/questions before exam |
| N+1 query | 🔴 FAIL | `findOne` deep-include `examQuestions.options` is one monolithic include |
| Session timeout | 🔴 FAIL | No cron/queue to auto-submit at `endTime` |
| Broadcast for multi-instance | 🔴 FAIL | Uses in-memory `Server.emit()`; no Redis adapter |

### 3.6 Questions & Question Banks
| Aspect | Status | Evidence |
|:---|:---:|:---|
| DOCX import engine | ✅ PASS | Custom state-machine parser (SQ/EQ + block markers) |
| Magic bytes check | ✅ PASS | `security.util` validates image content-type |
| Duplicate detection on import | 🔴 FAIL | No deduplication; re-import creates duplicates |
| Ownership guard | 🔴 FAIL | No ownership check on update/delete question banks |
| Large file blocking | 🔴 FAIL | `exceljs` import runs synchronously in main thread |
| Template download | ✅ PASS | `.docx` template with README block |

### 3.7 Exam Sessions (`exam-sessions/`)
| Aspect | Status | Evidence |
|:---|:---:|:---|
| Start/resume | ⚠️ PARTIAL | Allows resume but no `lastActiveAt` sync |
| Submit atomicity | ✅ PASS | **FIXED** — `submitAnswer` sekarang dibungkus `$transaction` |
| Auto-grade | ✅ PASS | Handles MCQ, True/False, Multiple Response |
| Manual grade | ✅ PASS | `gradeAnswer` + total recalculation |
| Export Excel | ✅ PASS | ExcelJS with styled header |
| Server timeout | 🔴 FAIL | No cron job to force-submit/expire at `exam.endTime` |
| Concurrency | 🔴 FAIL | No optimistic lock on submit; no `idempotency-key` support |

### 3.8 Realtime Module (`realtime/`)
| Aspect | Status | Evidence |
|:---|:---:|:---|
| JWT handshake | ✅ PASS | `client.handshake.auth.token` verified on connection |
| Graceful disconnect | ✅ PASS | Emits `student_offline` on disconnect |
| Proctor rooms | ✅ PASS | `proctor_{examId}` and `student_` rooms |
| Violation persistence | ⚠️ PARTIAL | Logs to DB, level hardcoded `RINGAN` |
| Redis adapter | 🔴 FAIL | In-memory only; no multi-instance support |

### 3.9 RBAC / Roles Module (`roles/`)
| Aspect | Status | Evidence |
|:---|:---:|:---|
| Custom role CRUD | ✅ PASS | Full CRUD with slug generation |
| Audit log | ✅ PASS | `roleAuditLog` created on create/update/clone/delete |
| System role protection | ✅ PASS | Cannot rename/delete system roles |
| Permissions matrix | ✅ PASS | `menu.submenu.permission` tree available |
| SUPER_ADMIN bypass | ✅ PASS | Hardcoded in `PermissionsGuard` |

### 3.10 Reports Module (`reports/`)
| Aspect | Status | Evidence |
|:---|:---:|:---|
| Catalog endpoint | ⚠️ PARTIAL | Returns metadata only; `generateUrl` is placeholder |
| Actual PDF/Excel reports | 🔴 FAIL | No implementation behind `/reports/student-master`, `/reports/achievement`, etc. |
| violation-report | 🔴 FAIL | Depends on auditLogs/violations, but no aggregation logic |
| Revenue report | 🔴 FAIL | Placeholder — no billing data model exists |

---

## 4. Cross-Cutting Concerns

### 4.1 Security
| Item | Status | Evidence |
|:---|:---:|:---|
| JWT secret fallback | ✅ PASS | **FIXED** — throw error jika `JWT_SECRET` tidak di-set |
| Settings unprotected GET | ✅ PASS | **FIXED** — `GET /settings` butuh SUPER_ADMIN |
| No password in LOGS | ⚠️ PARTIAL | Logger catches errors but validateUser swallows weak error diff |
| CORS | ⚠️ PARTIAL | `allowedOrigins` resolves to dev fallback `localhost:3000` if `.env` missing |
| Rate limiting | ✅ PASS | **FIXED** — 5 req/menit pada `/auth/login` |
| Content sanitization | 🔴 FAIL | No explicit sanitizer on `content` fields across Mutations |
| Audit log emission | 🔴 FAIL | `AuditLog` model exists but never called outside role module |
| No HTTPS enforcement | 🔴 FAIL | No TLS redirect/header logic |
| Error detail leakage | 🔴 FAIL | Prisma raw errors likely reach clients in some paths |

### 4.2 Testing
| Item | Status | Evidence |
|:---|:---:|:---|
| Unit tests present | ⚠️ PARTIAL | 17 spec files across 10 modules |
| Students spec | ✅ PASS | `students.controller.spec.ts`, `students.service.spec.ts` present |
| Teachers spec | ✅ PASS | Present |
| ExamSessions spec | 🔴 FAIL | No spec files |
| Realtime spec | ⚠️ PARTIAL | `realtime.service.spec.ts` exists but service is empty |
| Settings/Logs/Reports spec | 🔴 FAIL | None |
| E2E test | 🔴 FAIL | No Playwright/Cypress |
| Load test | 🔴 FAIL | No k6/Artillery |

### 4.3 Performance
| Item | Status | Evidence |
|:---|:---:|:---|
| DB connection pooling | ⚠️ PARTIAL | Uses `pg.Pool` with default size; no `pool.max` config |
| Slow query detection | ✅ PASS | Prisma `$on('query')` warns at ≥150ms |
| N+1 queries | 🔴 FAIL | `exams.findOne` with deep includes; no batching |
| Upload blocking | 🔴 FAIL | DOCX/Excel import synchronous |
| Caching | 🔴 FAIL | No Redis read cache; settings re-fetched per request |
| Pagination | 🔴 FAIL | No `take/skip` on list endpoints |

### 4.4 Reliability & Resilience
| Item | Status | Evidence |
|:---|:---:|:---|
| Circuit breaker | 🔴 FAIL | None |
| Timeout strategy | 🔴 FAIL | No fetch timeout, no DB query timeout |
| Health check | 🔴 FAIL | No `/health` endpoint |
| Graceful DB disconnect | ⚠️ PARTIAL | `onModuleDestroy` calls `$disconnect` only |
| Backup schedule | 🔴 FAIL | No automated backup configured |
| Submit atomicity | ✅ PASS | **FIXED** — `submitAnswer` now within `$transaction` |

### 4.5 DevOps & Observability
| Item | Status | Evidence |
|:---|:---:|:---|
| CI/CD | 🔴 FAIL | `.github` folder exists but no workflows documented |
| Container image | 🔴 FAIL | `Dockerfile` missing; `docker-compose.yml` covers DB/Redis only |
| Logging | ⚠️ PARTIAL | Winston + daily rotate, but no log aggregation/centralization |
| Error tracking | 🔴 FAIL | No Sentry/DataDog/Bugsnag |
| Metrics | 🔴 FAIL | No Prometheus exporter |
| .env documentation | ✅ PASS | **FIXED** — `apps/api/.env.example` now exists |
| TypeScript strictness | 🔴 FAIL | `strictNullChecks: false`, `noImplicitAny: false` |

---

## 5. Risk Register

| ID | Risk | Module | Severity | Likelihood | **Risk Level** | Mitigation | Owner | Status |
|:---|:---|:---|---:|---:|---:|:---|:---|:---:|
| R-01 | JWT secret fallback to `'default-secret'` | Auth | 🔴 4 | 🔴 4 | ~~🔴 16~~ | ✅ **FIXED** — env var now required | DevOps | ✅ **Fixed** |
| R-02 | Teachers default password `'password123'` hardcoded | Teachers | 🔴 4 | 🔴 4 | ~~🔴 16~~ | ✅ **FIXED** — random `crypto.randomBytes` | Backend | ✅ **Fixed** |
| R-03 | Unprotected `GET /settings` endpoint | Settings | 🔴 4 | 🟠 3 | ~~🔴 12~~ | ✅ **FIXED** — JWT guard + SUPER_ADMIN role | Backend | ✅ **Fixed** |
| R-04 | No server-side exam timeout/auto-submit | ExamSessions | 🔴 4 | 🟠 3 | **🔴 12** | Implement BullMQ delayed job / cron | Backend | **Open** |
| R-05 | No rate limiting on `/auth/login` | Auth | 🟠 3 | 🔴 4 | ~~🟠 12~~ | ✅ **FIXED** — ThrottlerGuard 5 req/menit | DevOps | ✅ **Fixed** |
| R-06 | WebSocket only: in-memory broadcast (no Redis) | Realtime | 🟠 3 | 🟠 3 | **🟠 9** | Socket.IO Redis adapter | Backend | **Open** |
| R-07 | Non-atomic `submitAnswer` — risk of partial writes | ExamSessions | 🟠 3 | 🟠 3 | ~~🟠 9~~ | ✅ **FIXED** — `$transaction` wrapper | Backend | ✅ **Fixed** |
| R-08 | N+1 query in `exams.findOne` | Exams | 🟡 2 | 🟠 3 | **🟡 6** | Batch selects / include pruning | Architect | **Open** |
| R-09 | No pagination on list endpoints | Multiple | 🟡 2 | 🟡 2 | **🟡 4** | Add `take/skip` with max cap | Backend | **Open** |
| R-10 | Synchronous DOCX/Excel import blocks event loop | Questions | 🟡 2 | 🟡 2 | **🟡 4** | Offload to BullMQ worker | Backend | **Open** |
| R-11 | No ownership check on question bank update/delete | Questions | 🟡 2 | 🟡 2 | **🟡 4** | Verify `teacherId` matches `req.user` | Backend | **Open** |
| R-12 | Audit log model unused outside RBAC module | All | 🟡 2 | 🟡 2 | **🟡 3** | Emit on every mutation via middleware/interceptor | Backend | **Open** |
| R-13 | No idempotency support on price-sensitive POST APIs | ExamSessions | 🟡 2 | 🟡 2 | **🟡 4** | Accept `Idempotency-Key` header | Backend | **Open** |
| R-14 | No automated backups for production DB | DevOps | 🟢 1 | 🟡 2 | **🟡 2** | Add pg_dump cron + S3/MinIO upload | DevOps | **Open** |
| R-15 | No `.env.example` → secrets discovered manually | DevOps | 🟢 1 | 🟡 2 | ~~🟡 2~~ | ✅ **FIXED** — `.env.example` created | DevOps | ✅ **Fixed** |
| R-16 | TypeScript strict checks disabled (`strictNullChecks: false`) | Build | 🟢 1 | 🟡 2 | **🟡 2** | Enable strict mode in `tsconfig.json` | All | **Open** |
| R-17 | Reports endpoints return placeholder URLs | Reports | 🟢 1 | 🟡 2 | **🟡 2** | Implement `generateReport` methods | Backend | **Open** |
| R-18 | `Notifications` model exists, `RealtimeService` empty | Realtime | 🟢 1 | 🟡 2 | **🟡 2** | Implement notification broadcasting | Backend | **Open** |
| R-19 | No compliance/data retention policy defined | All | 🟢 1 | 🟢 1 | **🟢 1** | Define retention + purge job | PO/Sec | **Open** |
| R-20 | README is generic Turborepo template (stale) | Docs | 🟢 1 | 🟢 1 | **🟢 1** | Replace with project-specific README | Docs | **Open** |

### Burn-Down Tracker

| Date | Critical | High | Medium | Low | Notes |
|:---|:---:|:---:|:---:|:---:|:---|
| 2026-06-14 (Baseline) | 4 | 5 | 7 | 4 | Initial audit |
| 2026-06-19 (Post-fix) | **2** | **4** | 7 | 5 | R-01, R-02, R-03, R-05, R-07, R-15 fixed |
| TBD (Post-Sprint 1) | — | — | — | — | |

---

## 6. Test Coverage Map

| Module | Files | Spec Files | Estimated Coverage | Notes |
|:---|---:|---:|---:|:---|
| Auth | 5 | 2 | ~35% | Missing `refresh` e2e, throttle test added |
| Exams | 5 | 2 | ~30% | No session lifecycle tests |
| Questions | 7 | 2 | ~25% | No import concurrency test |
| Question Bank | 5 | 2 | ~25% | |
| Students | 3 | 2 | ~25% | |
| Teachers | 3 | 2 | ~20% | |
| Users | 4 | 2 | ~30% | |
| Exam Sessions | 3 | **0** | **0%** | 🔴 No tests at all |
| Settings | 2 | **0** | **0%** | 🔴 No tests at all |
| Logs | 2 | **0** | **0%** | |
| Reports | 2 | **0** | **0%** | |
| Realtime | 3 | 1 | ~10% | Service empty; Gateway untested |
| Roles | 3 | **0** | **0%** | |
| Majors | 3 | **0** | **0%** | |
| Exam Groups | 3 | **0** | **0%** | |
| Rombels | 3 | **0** | **0%** | |
| **Total** | **62** | **17** | **~22%** | |

---

## 7. Severity Heatmap (by Module)

```
Auth            ██████         2 Critical, 0 High, 0 Medium
ExamSessions    ████████       0 Critical, 0 High, 0 Medium
Questions       ████████       0 Critical, 0 High, 0 Medium
Settings        ██             0 Critical, 0 High, 0 Medium
Teachers        ██             0 Critical, 0 High, 0 Medium
Exams           ████████       0 Critical, 0 High, 0 Medium
Realtime        ██             0 Critical, 0 High, 0 Medium
Reports         ████           0 Critical, 0 High, 0 Medium
Roles           ██             0 Critical, 0 High, 0 Medium
Users           ██             0 Critical, 0 High, 0 Medium
Students        ██             0 Critical, 0 High, 0 Medium
Logs            ██             0 Critical, 0 High, 0 Medium
Prisma/Schema   ████           0 Critical, 0 High, 0 Medium
DevOps/Config   █████          0 Critical, 0 High, 0 Medium
```

---

## 8. Next Steps (Prioritized)

### 🔴 Sprint 1 — Security & Integrity (Next Up)

| # | Task | Owner | Estimated |
|:---|:---|:---|:---:|
| 1 | Server-side exam timeout: cron/queue auto-submit at `endTime` | Backend | 2h |
| 2 | Enforce SEB browser validation in `ExamsController.findOne` | Backend | 30m |
| 3 | Add ownership check in `ExamSessionsService.startSession` (class/subject) | Backend | 30m |
| 4 | Add ownership guard on question bank update/delete | Backend | 30m |
| 5 | Prisma N+1 fix: batch-load `examQuestions.options` in `exams.findOne` | Architect | 2h |
| 6 | Add pagination (`take/skip`) on all `findAll` endpoints | Backend | 3h |
| 7 | Add DB indexes: `userId`, `examId`, `studentId`, `questionId` | DBA | 1h |
| 8 | Add health check `/api/health` with DB + Redis probe | DevOps | 1h |

### 🟡 Sprint 2 — Stability & Observability (Week 2–3)

| # | Task | Estimated |
|:---|:---|:---|
| 1 | Add BullMQ worker for `QuestionsImportService` (DOCX) | 3h |
| 2 | Add BullMQ worker for student/exam imports (Excel/CSV) | 2h |
| 3 | Add `lastActiveAt` heartbeat on WebSocket messages | 1h |
| 4 | Add `Idempotency-Key` support to `/exam-sessions/:id/submit-answer` | 1h |
| 5 | Add `AuditLog` emission middleware for all Mutations | 2h |
| 6 | Enable TypeScript strict mode in `tsconfig.json` | 1h |
| 7 | Replace in-memory Socket.IO with Redis adapter | 2h |

### 🟢 Sprint 3 — Quality & Production Hardening (Month 2)

| # | Task |
|:---|:---|
| 1 | `npm audit` / dependency scan; patch high/critical |
| 2 | Sentry/Bugsnag integration |
| 3 | Structured request ID + correlation ID middleware |
| 4 | HTTPS header enforcement (HSTS, CSP) |
| 5 | Dockerize API (`Dockerfile` + full `docker-compose`) |
| 6 | CI/CD: `build → lint → typecheck → test → sonar` on PR |
| 7 | Implement actual report generators (PDF/Excel for student/exam/violation reports) |
| 8 | Write E2E tests for critical flows (Playwright) |
| 9 | Load test baseline (k6 — 1000 concurrent users) |
| 10 | Add automated DB backup schedule |

---

## 9. Appendix: Raw Code References (Fixed Items)

| Finding | File | Fix |
|:---|:---|:---|
| JWT fallback secret | `apps/api/src/auth/strategies/jwt.strategy.ts` | ✅ Remove `|| 'default-secret'`, throw if env missing |
| Hardcoded teacher password | `apps/api/src/teachers/teachers.service.ts` | ✅ Ganti dengan `crypto.randomBytes(12).toString('hex')` |
| Hardcoded password import | `apps/api/src/users/users.service.ts` | ✅ Ganti `'password123'` dengan random hex |
| Unprotected GET settings | `apps/api/src/settings/settings.controller.ts` | ✅ Tambah `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles(SUPER_ADMIN)` |
| Non-atomic submit answer | `apps/api/src/exam-sessions/exam-sessions.service.ts` | ✅ Bungkus dalam `$transaction` |
| No rate limit login | `apps/api/src/auth/auth.controller.ts` + `auth.module.ts` | ✅ Tambah `@nestjs/throttler` + `ThrottlerGuard` (5 req/menit) |
| No `.env.example` | `apps/api/` | ✅ Buat `apps/api/.env.example` dengan 9 variabel |
| Missing env vars | `apps/api/.env` | ✅ Tambah `NODE_ENV`, `CORS_ORIGINS`, `REDIS_URL`, `FRONTEND_URL` |

---

*Report auto-generated from codebase audit on 2026-06-19. Updated after fix session on same day.*  
*Re-run after each sprint and update Risk Burn-Down Tracker.*
