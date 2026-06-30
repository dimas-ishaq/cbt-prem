# Suite Overview

## Auth (no dep)
| File | P | Status |
|---|---|---|
| `auth/login.spec.ts` | P0 | ✅ |
| `auth/logout.spec.ts` | P0 | ✅ |
| `auth/rbac.spec.ts` | P1 | ✅ |

## Student (dep: setup-student)
| File | P | Status |
|---|---|---|
| `student/dashboard.spec.ts` | P0 | ✅ |
| `student/exam-session.spec.ts` | P0 | ✅ skeleton |

## Admin (dep: setup-admin)
| File | P | Status |
|---|---|---|
| `admin/exam-create.spec.ts` | P0 | ✅ |
| `admin/exam-list.spec.ts` | P0 | ✅ |
| `admin/exam-edit.spec.ts` | P0 | ✅ |
| `admin/monitoring.spec.ts` | P1 | ✅ |
| `admin/results.spec.ts` | P1 | ✅ |
| `admin/reports.spec.ts` | P1 | ✅ |
| `admin/settings.spec.ts` | P1 | ✅ |
| `admin/notifications.spec.ts` | P1 | ✅ |
| `admin/logs.spec.ts` | P1 | ✅ |
| `admin/master-data.spec.ts` | P1 | ✅ |
| `admin/users.spec.ts` | P1 | ✅ |
| `admin/roles.spec.ts` | P1 | ✅ |
| `admin/question-bank.spec.ts` | P1 | ✅ |
| `admin/exam-groups.spec.ts` | P1 | ✅ |
| `admin/exam-cards.spec.ts` | P2 | ✅ skeleton |
| `admin/profile.spec.ts` | P2 | ✅ skeleton |
| `admin/sounds.spec.ts` | P2 | ✅ skeleton |
| `admin/monitoring-history.spec.ts` | P2 | ✅ skeleton |
| `admin/monitoring-upcoming.spec.ts` | P2 | ✅ skeleton |
| `admin/analytics.spec.ts` | P2 | ✅ skeleton |
| `admin/essay-grading.spec.ts` | P2 | ✅ skeleton |
| `admin/results-sessions.spec.ts` | P2 | ✅ skeleton |

## Setup files
- `setup/student.setup.ts`
- `setup/admin.setup.ts`
- `setup/superadmin.setup.ts`

## Helpers
- `helpers/auth.ts`

## Total: 26 spec files + 3 setup + 1 helper
- P0: 8
- P1: 10
- P2: 8

## Command to run per group
```bash
# auth only (no setup needed)
bunx playwright test --project=auth

# student dashboard (needs setup-student)
bunx playwright test --project=student-dashboard

# admin exam create (needs setup-admin)
bunx playwright test --project=admin-exam-create

# all
bunx playwright test

# all with headless=false for visual debug
HEADLESS=false bunx playwright test
```

## Gap masih
- data-testid: 0
- CI pipeline: belum
- exam session: skeleton
- API contract test: 0
