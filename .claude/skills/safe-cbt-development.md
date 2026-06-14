# 🛡️ Skill: Safe CBT Feature Development

> **Purpose:** Memastikan setiap fitur CBT Premium dapat dibangun dengan progress yang aman, terstruktur, dan minim bug.  
> **Audience:** Developer, QA, Tech Lead  
> **Trigger:** Digunakan sebelum memulai implementasi fitur baru atau modifikasi fitur existing.

---

## 📌 KAPabilitas

Skill ini terdiri dari 6 fase yang dijalankan berurutan:
1. **Requirement Analysis** — Validasi kebutuhan sebelum coding
2. **Database-First Design** — Skema & relasi diverifikasi terlebih dahulu
3. **Service-First Implementation** — Logic bisnis diisolasi dari controller
4. **Automated Testing** — Unit, integration, dan E2E tests
5. **Security & Performance Audit** — Scan otomatis sebelum merge
6. **Go-Live Checklist** — Verifikasi akhir sebelum produksi

**Skill Rule:** Tidak boleh ada merge ke `main` jika salah satu dari 6 fase belum lulus pengecekan.

---

## 🎯 PRINSIP DASAR

| # | Prinsip | Deskripsi |
|:---:|:---|:---|
| 1 | **Database-First** | Setiap fitur dimulai dari skema Prisma, bukan dari code |
| 2 | **Test-First** | Tulis minimal 1 failing test sebelum implementasi kode |
| 3 | **Guard All The Things** | Setiap endpoint dilindungi `@UseGuards` + `@Roles` |
| 4 | **Fail Fast** | Validasi awal (DTO), bukan validasi akhir (catch block) |
| 5 | **Audit Trail** | Setiap mutation menyisipkan `AuditLog` |
| 6 | **No Hardcoded Secrets** | Semua konfigurasi via `process.env` |
| 7 | **Rollback Ready** | Setiap penetapan migrasi/seed harus bisa di-rollback |

---

## 📋 FASE 1: REQUIREMENT ANALYSIS

### Checklist Pre-Development

| Pertanyaan | Ya | Tidak | Catatan |
|:---|:---:|:---:|:---|
| Apakah fitur ini membahayakan data ujian (Exam)? | ☐ | ☐ | Jika ya → **P0 Priority** |
| Apakah ada input user baru? | ☐ | ☐ | Jika ya → buatkan DTO + validation |
| Apakah ada perubahan skema database? | ☐ | ☐ | Jika ya → buatkan migration PR |
| Apakah ada dependency ke modul lain? | ☐ | ☐ | Mapping dependency graph |
| Apakah butuh RBAC? | ☐ | ☐ | Mapping role → permission |

### Deliverable
```
docs/features/[nama-fitur].md
```

Contoh struktur:
```markdown
# Fitur: [Nama]

## Deskripsi
...

## Database Changes
...

## API Endpoints
...

## RBAC Matrix
...

## Test Strategy
...
```

---

## 🗄️ FASE 2: DATABASE-FIRST DESIGN

### Step 2.1: Validasi Skema

```prisma
// Selalu tambahkan:
// - @updatedAt untuk entitas mutable
// - @relation untuk FK yang jelas
// - @@unique untuk constraint bisnis
```

### Step 2.2: Buat Migration (PR Wajib)

```bash
# A. Buat branch migration
git checkout -b feature/add-exam-tokens

# B. Buat migration
pnpm prisma migrate dev --name add_exam_tokens

# C. Review migration SQL
cat prisma/migrations/[timestamp]/migration.sql

# D. HAPUS JIKA ADA raw SQL tanpa review!
```

### Step 2.3: Update Model Services

- [ ] Tambahkan method CRUD di `PrismaService` jika reusable
- [ ] Jangan hardcode nama tabel, gunakan Prisma model
- [ ] Gunakan `$transaction` untuk multi-write

### Step 2.4: Update Seeder

- [ ] Tambahkan data seed untuk fitur baru
- [ ] Test: `bun prisma/seed.ts`
- [ ] Pastikan tidak ada FK constraint violation

### Contoh Checklist Seeder
```typescript
// ✅ DO: Hubungkan ke entity yang ada
const exam = await prisma.exam.create({
  data: {
    subjectId: existingSubject.id, // Foreign Key aman
    ...
  }
});

// ❌ DON'T: Hardcode ID yang mungkin tidak ada
const exam = await prisma.exam.create({
  data: {
    subjectId: 'sub_abc123', // ⚠️ Hanya bekerja di dev, break di CI
    ...
  }
});
```

---

## 🎨 FASE 3: SERVICE-FIRST IMPLEMENTATION

### Arsitektur Wajib

```
┌──────────────────────────────────────────┐
│              CONTROLLER LAYER             │
│  (Route, Guard, DTO Validation Only)     │
└───────────────────┬──────────────────────┘
                    │ calls
┌───────────────────▼──────────────────────┐
│              SERVICE LAYER                │
│  (Business Logic, Transactions, Errors)  │
└───────────────────┬──────────────────────┘
                    │ calls
┌───────────────────▼──────────────────────┐
│              PRISMA LAYER                 │
│         (Database Access)                 │
└──────────────────────────────────────────┘
```

### Rule Controller
- ✅ **HANYA** `@Get`, `@Post`, `@Body`, `@Param`
- ✅ `@UseGuards(JwtAuthGuard, RolesGuard)`
- ✅ `@Roles(...)`
- ✅ Return type `Response<T>`
- ❌ **JANGAN** ada logic bisnis
- ❌ **JANGAN** ada `console.log`
- ❌ **JANGAN** ada `try-catch` (biar Exception Filter yang handle)

### Rule Service
- ✅ Semua logic bisnis ada di sini
- ✅ Gunakan `PrismaService` via constructor injection
- ✅ Gunakan `$transaction` untuk atomic operations
- ✅ Lempar `NotFoundException`, `ForbiddenException`, `BadRequestException`
- ✅ **WAJIB** emit `AuditLog` di setiap mutation
- ❌ **JANGAN** direkt return `Prisma` result tanpa transformasi

### Rule DTO
- ✅ Gunakan `class-validator` untuk setiap field
- ✅ Gunakan `class-transformer` jika perlu transformasi
- ✅ Jangan terima `any` atau `unknown` tanpa validasi
- ✅ Buat DTO khusus untuk `create`, `update`, `query`

### Audit Log Pattern (WAJIB)

```typescript
// Setelah setiap create/update/delete
await this.auditLogService.create({
  userId: currentUser.id,
  action: 'EXAM_CREATED',
  entity: 'Exam',
  entityId: exam.id,
  oldValue: null,
  newValue: exam,
  ipAddress: request.ip,
  userAgent: request.headers['user-agent'],
});
```

---

## 🧪 FASE 4: AUTOMATED TESTING

### Test Pyramid untuk CBT

```
        /\
       /E2E\      ← 10% (Playwright/Cypress - Critical flows only)
      /────\
     /Integ.\    ← 20% (Supertest - Module interactions)
    /────────\
   /  Unit     \ ← 70% (Jest - Services, Guards, DTOs)
  /────────────\
```

### Coverage Target

| Module | Target | Critical? |
|:---|:---:|:---:|
| Auth Service | 90% | ✅ P0 |
| Exam Sessions Service | 90% | ✅ P0 |
| Exams Service | 80% | ✅ P0 |
| Realtime Gateway | 70% | ✅ P0 |
| Students Service | 80% | 🟠 P1 |
| Questions Service | 75% | 🟡 P2 |
| Subjects Service | 70% | 🟡 P2 |
| Settings Service | 90% | 🔴 P0 |

### Rule: TDD Forced

```bash
# 1. Tulis test dulu (harus FAIL)
pnpm test -- --testPathPattern=exam-sessions.service

# 2. Implementasi sampai PASS
pnpm test -- --testPathPattern=exam-sessions.service

# 3. Coverage check
pnpm test:coverage -- --testPathPattern=exam-sessions.service
```

### Minimal Test Requirement per Feature

| Tipe Test | Jumlah Minimal | Contoh |
|:---|:---:|:---|
| Unit Test | 3 | Happy path, validation error, unauthorized |
| Integration Test | 2 | Flow success, flow with DB constraint |
| E2E Test | 1 | Full user journey (optional untuk fitur minor) |

### Test Template

```typescript
describe('ExamSessionsService', () => {
  let service: ExamSessionsService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [ExamSessionsService, PrismaService],
    }).compile();
    service = module.get<ExamSessionsService>(ExamSessionsService);
  });

  describe('startSession', () => {
    it('should start session for valid student + exam', async () => {
      // Arrange
      const mockStudent = { id: 'stu_1', userId: 'usr_1' };
      const mockExam = { id: 'exam_1', status: ExamStatus.PUBLISHED };
      
      // Act
      const result = await service.startSession(dto, 'usr_1');
      
      // Assert
      expect(result.status).toBe(SessionStatus.IN_PROGRESS);
    });

    it('should throw ForbiddenException if not a student', async () => {
      await expect(service.startSession(dto, 'usr_999'))
        .rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if exam not published', async () => {
      // ...
    });
  });
});
```

---

## 🔒 FASE 5: SECURITY & PERFORMANCE AUDIT

### 5.1 Security Checklist (Otomatis via Husky)

Jalankan **sebelum commit**:

```bash
# 1. Dependency check
pnpm audit --audit-level=high

# 2. Type check
pnpm typecheck

# 3. Lint
pnpm lint:check

# 4. Secret scan (git-secrets)
git secrets --scan

# 5. OWASP ZAP baseline scan (CI only)
docker run -t owasp/zap2docker-stable zap-baseline.py \
  -t https://staging-api.cbtenterprise.com
```

### 5.2 Must-Pass Security Rules

| # | Rule | Auto-Check? | Manual? |
|:---:|:---|:---:|:---:|
| 1 | Tidak ada `default-secret` atau hardcoded password | ✅ | ❌ |
| 2 | Semua endpoint punya `@UseGuards` | ✅ | ❌ |
| 3 | Tidak ada `console.log` di production code | ✅ | ❌ |
| 4 | Tidak ada `eval()` atau `Function()` constructor | ✅ | ❌ |
| 5 | CORS tidak menggunakan `'*'` | ✅ | ❌ |
| 6 | JWT expiry di bawah 24 jam | ✅ | ❌ |
| 7 | Password minimal bcrypt cost 10 | ✅ | ❌ |
| 8 | Semua input user di-sanitize | ❌ | ✅ |
| 9 | AuditLog ter generate di semua mutation | ❌ | ✅ |
| 10 | SOAP/File upload ada virus scan | ❌ | ✅ |

### 5.3 Performance Checklist

| Metric | Target | Tool | Check |
|:---|:---:|:---|:---:|
| API Response (P95) | <500ms | k6 | ✅ Auto |
| DB Query Time (P95) | <100ms | Prisma logs | ✅ Auto |
| Memory Usage | <512MB | clinic.js | ❌ Manual |
| Connection Pool | <80% used | Prisma metrics | ✅ Auto |
| N+1 Queries | 0 | ESLint plugin | ✅ Auto |

### N+1 Detection Rule

```typescript
// ❌ BAD: N+1 pattern
const exams = await prisma.exam.findMany();
for (const exam of exams) {
  exam.subject; // Lazy load di loop = N+1
}

// ✅ GOOD: Eager load
const exams = await prisma.exam.findMany({
  include: { subject: true, questions: true }
});
```

### ESLint Rule (Tambahkan ke .eslintrc.js)

```javascript
rules: {
  'no-console': ['error', { allow: ['warn', 'error'] }],
  'no-restricted-syntax': [
    'error',
    {
      selector: "ImportDeclaration[importKind='value']",
      message: 'No value imports from prisma client',
    },
  ],
  // Custom rule untuk deteksi N+1
  'no-loop-find': 'error',
}
```

---

## 🚀 FASE 6: GO-LIVE CHECKLIST

### 6.1 Pre-Merge Checks

| Check | Tool | Pass? |
|:---|:---|:---:|
| Unit Test Coverage > target | Jest | ☐ |
| Integration Tests pass | Supertest | ☐ |
| E2E Tests pass (critical paths) | Playwright | ☐ |
| Lint + Typecheck | ESLint + tsc | ☐ |
| Security scan | `npm audit` | ☐ |
| DB Migration reviewed | Manual PR | ☐ |
| AuditLog verified | Manual test | ☐ |
| RBAC tested | Manual/RBAC matrix | ☐ |
| DTO validation tested | Unit test | ☐ |
| Error handling tested | Unit test | ☐ |

### 6.2 Staging Deployment

```bash
# 1. Deploy ke staging
git push origin feature/xyz

# 2. Run smoke test
pnpm test:smoke

# 3. Load test minimal (100 users)
pnpm loadtest:100

# 4. Security scan (OWASP ZAP)
pnpm security:scan:staging

# 5. QA Sign-off
# Dokumentasi: docs/qa-signoff/[feature].md
```

### 6.3 Production Promotion

| Approval | Role | Status |
|:---|:---:|:---|
| Code Review | Senior Dev | ☐ |
| QA Approval | QA Lead | ☐ |
| Security Approval | Security Auditor | ☐ |
| Performance Approval | Performance Eng | ☐ |
| PO Approval | Product Owner | ☐ |

**SKILL RULE:** Tanpa 5 approval di atas, fitur **TIDAK BOLEH** masuk produksi.

---

## ⚠️ PROHIBITED PATTERNS

### Anti-Patterns (DILARANG KERAS)

| # | Pattern | Risk | Solution |
|:---:|:---|:---:|:---|
| 1 | `SELECT *` di Prisma | Data leak + N+1 | Pilih field eksplisit |
| 2 | `await` di loop tanpa `Promise.all` | Performance | Gunakan parallel execution |
| 3 | Hardcoded `userId` atau `role` | Security bug | Gunakan `request.user` |
| 4 | Empty `catch` block | Silent failure | Log + re-throw |
| 5 | Mutation tanpa `AuditLog` | Compliance violation | Tambahkan pattern audit |
| 6 | Controller dengan business logic | Maintenance hell | Pindah ke Service |
| 7 | Magic number/string | Unclear requirement | Buat `enum` atau `const` |
| 8 | `any` type di TypeScript | Type safety | Buat interface/type |
| 9 | Sync file I/O di NestJS | Block event loop | Gunakan queue |
| 10 | Commented code | Tech debt | Hapus atau dokumentasi |

### Code Smell Detector

```bash
# Jalankan di pre-commit
pnpm lint:strict
pnpm typecheck
pnpm test:coverage -- --bail
```

---

## 🛠️ TOOLING & AUTOMATION

### Required Tools

| Tool | Purpose | Installation |
|:---|:---|:---|
| `Husky` | Git hooks automation | `pnpm add -D husky` |
| `lint-staged` | Run linter on staged files | `pnpm add -D lint-staged` |
| `@nestjs/throttler` | Rate limiting | `pnpm add @nestjs/throttler` |
| `class-validator` | DTO validation | Sudah ada |
| `@prisma/client` | ORM | Sudah ada |
| `Jest` | Unit testing | Sudah ada |
| `Supertest` | Integration testing | `pnpm add -D supertest` |
| `k6` | Load testing | `brew install k6` |
| `OWASP ZAP` | Security scan | Docker |

### Husky Pre-Commit Hook

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

echo "🔍 Running pre-commit checks..."

# 1. Type check
echo "Running typecheck..."
pnpm typecheck || exit 1

# 2. Lint
echo "Running lint..."
pnpm lint:check || exit 1

# 3. Tests for changed files
echo "Running affected tests..."
pnpm test:affected || exit 1

# 4. Security scan
echo "Running security scan..."
pnpm audit:high || exit 1

echo "✅ Pre-commit checks passed!"
```

### CI Pipeline (GitHub Actions)

```yaml
# .github/workflows/ci.yml
name: CBT Feature CI
on: [pull_request]

jobs:
  quality-gate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
      
      - name: Install Dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Typecheck
        run: pnpm typecheck
      
      - name: Lint
        run: pnpm lint:check
      
      - name: Unit Tests
        run: pnpm test:coverage
      
      - name: Upload Coverage
        uses: codecov/codecov-action@v3
      
      - name: Security Audit
        run: pnpm audit:high
      
      - name: OWASP ZAP Scan
        run: docker run -t owasp/zap2docker-stable zap-baseline.py \
          -t https://staging-api.cbtenterprise.com
```

---

## 📊 TRACKING & MONITORING

### Skill Adoption Metrics

| Metric | Target | Measurement |
|:---|:---:|:---|
| Pre-commit hook adoption | 100% | Git hook exists di semua dev machine |
| Test coverage per PR | >80% | Codecov badge |
| Migration review time | <24h | PR age |
| Bug escape rate | <5% | Bugs found in staging/prod vs total |
| AuditLog completeness | 100% | Manual audit monthly |
| Security scan pass rate | 100% | CI green build only |

### Definition of Done (DoD)

Fitur dianggap **SELESAI** hanya jika:

1. ✅ Semua test pass (unit + integration)
2. ✅ Coverage mencapai target
3. ✅ Dokumentasi `docs/features/[nama].md` ditulis
4. ✅ Migration + rollback script ada
5. ✅ Seeder data ditambahkan
6. ✅ Security checklist di-review
7. ✅ RBAC matrix diperbarui
8. ✅ QA telah approve
9. ✅ Code review minimal 1 approver
10. ✅ Semua Husky hooks passing

---

## 🆘 EMERGENCY PROCEDURES

### Jika Ada Bug Produksi

```bash
# 1. STOP - Jangan langsung fix di main
git checkout -b hotfix/[nama-bug]

# 2. REPRODUCE - Buat test yang reproduce bug
pnpm test -- --testNamePattern="reproduce bug XYZ"

# 3. FIX - Minimal perubahan
# 4. VERIFY - Test pass
# 5. ROLLBACK PLAN - Siapkan rollback script
```

### Jika Ada Data Corruption

```bash
# 1. STOP all writes
# 2. Snapshot database
pg_dump -h localhost -U postgres cbt_prem > snapshot_$(date +%F).sql

# 3. Investigate
# 4. Fix via migration atau script recovery
# 5. Verify data integrity
pnpm prisma/seed:verify
```

---

## 📝 SKILL ACTIVATION COMMAND

Untuk menggunakan skill ini, developer harus menulis di awal PR description:

```
@skill safe-cbt-development

## Checklist
- [ ] Fase 1: Requirement Analysis
- [ ] Fase 2: Database-First Design
- [ ] Fase 3: Service-First Implementation
- [ ] Fase 4: Automated Testing
- [ ] Fase 5: Security & Performance Audit
- [ ] Fase 6: Go-Live Checklist
```

---

## 🔄 SKILL MAINTENANCE

| Task | Frequency | Owner |
|:---|:---:|:---|
| Review dan update skill ini | Bulanan | Tech Lead |
| Update rules berdasarkan bug baru | Setiap bug | QA Lead |
| Update tooling versions | Per sprint | DevOps |
| Training tim tentang skill ini | Per onboarding | Senior Dev |

---

> **Skill Status:** Active  
> **Version:** 1.0  
> **Last Updated:** 2026-06-14  
> **Enforced By:** Tech Lead + QA Lead  
> **Violation Consequences:** PR ditolak, akses staging direvoke sementara
