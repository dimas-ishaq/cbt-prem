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
- TC-AUTH-005 Logout hapus session — DONE

## RBAC
- TC-RBAC-001 Siswa block akses admin — DONE
- TC-RBAC-002 Siswa block halaman hasil admin — DONE
- TC-RBAC-003 Guru akses admin valid — DONE
- TC-RBAC-004 Superadmin akses admin valid — DONE

## Student Dashboard
- TC-STU-001 Dashboard render — DONE
- TC-STU-002 Riwayat pengerjaan buka — DONE
- TC-STU-003 Server time tampil — DONE
- TC-STU-004 Upload foto profil sukses — DONE

## Exam List
- TC-EXAM-001 List ujian tampil — DONE
- TC-EXAM-002 Filter status ujian — DONE
- TC-EXAM-003 Search ujian — DONE
- TC-EXAM-004 Delete ujian — DONE

## Create Exam
- TC-EXAM-CREATE-001 Form create render — DONE
- TC-EXAM-CREATE-002 Validasi field wajib — DONE
- TC-EXAM-CREATE-003 Create exam sukses — DONE
- TC-EXAM-CREATE-004 Token generate — DONE
- TC-EXAM-CREATE-005 SEB config conditional — DONE

## Edit Exam
- TC-EXAM-EDIT-001 Edit exam render — DONE
- TC-EXAM-EDIT-002 Update exam sukses — DONE

## Student Exam Session
- TC-SES-001 Buka halaman ujian — DONE
- TC-SES-002 Start session — DONE
- TC-SES-003 Jawab soal pilihan ganda — DONE
- TC-SES-004 Jawab essay — DONE
- TC-SES-005 Submit ujian — DONE
- TC-SES-006 Autosave jalan — DONE
- TC-SES-007 Timer countdown tampil — DONE

## Monitoring
- TC-MON-001 Monitoring render — DONE
- TC-MON-002 Filter progress — DONE
- TC-MON-003 Filter violation — DONE
- TC-MON-004 Search siswa — DONE
- TC-MON-005 Lock student — DONE
- TC-MON-006 Unlock student — DONE

## Results
- TC-RES-001 Results render — DONE
- TC-RES-002 Filter rombel — DONE
- TC-RES-003 Filter status — DONE
- TC-RES-004 Search hasil — DONE
- TC-RES-005 Export xlsx — DONE
- TC-RES-006 Bulk reset sessions — PARTIAL
- TC-RES-007 Single reset session — PARTIAL

## Reports
- TC-RPT-001 Reports render — DONE
- TC-RPT-002 Generate report — PARTIAL
- TC-RPT-003 Report exam group detail — DONE

## Notifications
- TC-NOTIF-001 Notification list render — DONE
- TC-NOTIF-002 Update notification policy — DONE

## Settings
- TC-SET-001 Settings render — DONE
- TC-SET-002 Update settings — DONE
- TC-SET-003 Notification settings render — DONE

## Master Data
- TC-MST-001 Subjects render — DONE
- TC-MST-002 Majors render — DONE
- TC-MST-003 Rombels render — DONE
- TC-MST-004 Users render — DONE
- TC-MST-005 Roles render — DONE

## Logs
- TC-LOG-001 Logs render — DONE
- TC-LOG-002 Audit log mutation visible — PARTIAL

## Profile
- TC-PROF-001 Student profile render — DONE
- TC-PROF-002 Upload photo invalid type — DONE

## API
- TC-API-001 GET /settings — DONE
- TC-API-002 GET /server-time — DONE
- TC-API-003 GET /dashboard/stats — DONE
- TC-API-004 GET /exams — DONE
- TC-API-005 GET /exam-sessions/exam/:id — DONE
- TC-API-006 POST /exam-sessions/bulk-reset — DONE
