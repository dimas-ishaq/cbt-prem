# Automation Gap Matrix

## Legend
- **DONE** = spec file exists and covers intent
- **PARTIAL** = spec exists but skeleton / weak assertion / not 1:1
- **MISSING** = no spec yet

## Auth
- TC-AUTH-001 Login siswa sukses — DONE
- TC-AUTH-002 Login guru sukses — DONE
- TC-AUTH-003 Login superadmin sukses — DONE
- TC-AUTH-004 Login salah tampil error — DONE
- TC-AUTH-005 Logout hapus session — PARTIAL

## RBAC
- TC-RBAC-001 Siswa block akses admin — DONE
- TC-RBAC-002 Siswa block halaman hasil admin — MISSING
- TC-RBAC-003 Guru akses admin valid — MISSING
- TC-RBAC-004 Superadmin akses admin valid — MISSING

## Student Dashboard
- TC-STU-001 Dashboard render — DONE
- TC-STU-002 Riwayat pengerjaan buka — DONE
- TC-STU-003 Server time tampil — DONE
- TC-STU-004 Upload foto profil sukses — MISSING

## Exam List
- TC-EXAM-001 List ujian tampil — PARTIAL
- TC-EXAM-002 Filter status ujian — PARTIAL
- TC-EXAM-003 Search ujian — PARTIAL
- TC-EXAM-004 Delete ujian — MISSING

## Create Exam
- TC-EXAM-CREATE-001 Form create render — PARTIAL
- TC-EXAM-CREATE-002 Validasi field wajib — MISSING
- TC-EXAM-CREATE-003 Create exam sukses — PARTIAL
- TC-EXAM-CREATE-004 Token generate — MISSING
- TC-EXAM-CREATE-005 SEB config conditional — MISSING

## Edit Exam
- TC-EXAM-EDIT-001 Edit exam render — PARTIAL
- TC-EXAM-EDIT-002 Update exam sukses — MISSING

## Student Exam Session
- TC-SES-001 Buka halaman ujian — PARTIAL
- TC-SES-002 Start session — MISSING
- TC-SES-003 Jawab soal pilihan ganda — MISSING
- TC-SES-004 Jawab essay — MISSING
- TC-SES-005 Submit ujian — MISSING
- TC-SES-006 Autosave jalan — MISSING
- TC-SES-007 Timer expired auto submit — MISSING

## Monitoring
- TC-MON-001 Monitoring render — PARTIAL
- TC-MON-002 Filter progress — PARTIAL
- TC-MON-003 Filter violation — MISSING
- TC-MON-004 Search siswa — MISSING
- TC-MON-005 Lock student — MISSING
- TC-MON-006 Unlock student — MISSING

## Results
- TC-RES-001 Results render — PARTIAL
- TC-RES-002 Filter rombel — PARTIAL
- TC-RES-003 Filter status — MISSING
- TC-RES-004 Search hasil — MISSING
- TC-RES-005 Export xlsx — MISSING
- TC-RES-006 Bulk reset sessions — MISSING
- TC-RES-007 Single reset session — MISSING

## Reports
- TC-RPT-001 Reports render — PARTIAL
- TC-RPT-002 Generate report — MISSING
- TC-RPT-003 Report exam group detail — PARTIAL

## Notifications
- TC-NOTIF-001 Notification list render — PARTIAL
- TC-NOTIF-002 Update notification policy — MISSING

## Settings
- TC-SET-001 Settings render — PARTIAL
- TC-SET-002 Update settings — MISSING
- TC-SET-003 Notification settings render — PARTIAL

## Master Data
- TC-MST-001 Subjects render — PARTIAL
- TC-MST-002 Majors render — PARTIAL
- TC-MST-003 Rombels render — PARTIAL
- TC-MST-004 Users render — DONE
- TC-MST-005 Roles render — DONE

## Logs
- TC-LOG-001 Logs render — DONE
- TC-LOG-002 Audit log mutation visible — MISSING

## Profile
- TC-PROF-001 Student profile render — PARTIAL
- TC-PROF-002 Upload photo invalid type — MISSING

## API
- TC-API-001 GET /settings — MISSING
- TC-API-002 GET /server-time — MISSING
- TC-API-003 GET /dashboard/stats — MISSING
- TC-API-004 GET /exams — MISSING
- TC-API-005 GET /exam-sessions/exam/:id — MISSING
- TC-API-006 POST /exam-sessions/bulk-reset — MISSING
