# Automation Test Cases Status

## Done / Partial / Missing
- see `docs/automation-gap-matrix.md` (all TC marked DONE except: TC-RES-006, TC-RES-007 Bulk/Single reset, TC-RPT-002 Generate report, TC-LOG-002 Audit log — PARTIAL)

## Run order
1. TC-AUTH-001 .. 005
2. TC-RBAC-001 .. 004
3. TC-STU-001 .. 004
4. TC-EXAM-001 .. 005
5. TC-EXAM-CREATE-001 .. 005
6. TC-EXAM-EDIT-001 .. 002
7. TC-SES-001 .. 007
8. TC-MON-001 .. 006
9. TC-RES-001 .. 007
10. TC-RPT-001 .. 003
11. TC-NOTIF-001 .. 002
12. TC-SET-001 .. 003
13. TC-MST-001 .. 005
14. TC-LOG-001 .. 002
15. TC-PROF-001 .. 002
16. TC-API-001 .. 006

## Spec count
- Auth: 3 files (login, logout, rbac)
- Student: 2 files (dashboard, exam-session)
- Admin: 17 files (exam-create, exam-list, exam-edit, monitoring, results, reports, settings, notifications, logs, master-data, users, roles, question-bank, exam-groups, profile, sounds, exam-cards, essay-grading, analytics, monitoring-history, monitoring-upcoming, results-sessions)
- API: 1 file (api-contract)
- Setup: 3 files (student, admin, superadmin)
- Helpers: 1 file (auth)

Total: 27 spec files + 3 setup files = 30 test files