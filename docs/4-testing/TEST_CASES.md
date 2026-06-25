# 🧪 DETAILED TEST CASE SPECIFICATION

## 1. Auth Module

### 1.1 Positive Flows

| TC-ID | Scenario | Pre-Condition | Steps | Expected Result |
| :--- | :--- | :--- | :--- | :--- |
| `TC-AUTH-001` | Valid Login | User exists, password correct | 1. POST `/api/auth/login` with valid credentials<br>2. Receive JWT | 200 OK + `access_token`, `refresh_token` |
| `TC-AUTH-002` | Invalid Login | User exists, wrong password | 1. POST `/api/auth/login` with wrong password | 401 Unauthorized |
| `TC-AUTH-003` | Refresh Token | Valid refresh token provided | 1. POST `/api/auth/refresh` with token | 200 OK + new `access_token` |
| `TC-AUTH-004` | RBAC Guru Access | Authenticated as GURU | 1. GET `/api/exams` with GURU token | 200 OK |
| `TC-AUTH-005` | RBAC Siswa Blocked | Authenticated as SISWA | 1. POST `/api/exams` with SISWA token | 403 Forbidden |

### 1.2 Negative Flows / Security

| TC-ID | Scenario | Steps | Expected Result |
| :--- | :--- | :--- | :--- |
| `TC-AUTH-006` | Brute Force Protection | 5x failed login attempts in 1 min | 429 Too Many Requests (if rate limit implemented) |
| `TC-AUTH-007` | JWT Tampered | Modify JWT payload, send request | 401 Unauthorized (invalid signature) |
| `TC-AUTH-008` | Expired Token | Wait for JWT expiry, call protected endpoint | 401 Unauthorized |
| `TC-AUTH-009` | No Token Provided | Call protected endpoint without header | 401 Unauthorized |

---

## 2. Exams Module

### 2.1 Functional

| TC-ID | Scenario | Pre-Condition | Steps | Expected Result |
| :--- | :--- | :--- | :--- | :--- |
| `TC-EXAM-001` | Create Exam | Guru authenticated | 1. POST `/api/exams`<br>2. Body includes `questionIds` | 201 Created + exam |
| `TC-EXAM-002` | List All Exams | Any auth | 1. GET `/api/exams` | 200 OK + exams, subjects, teacher |
| `TC-EXAM-003` | Publish Exam | Draft exam exists | 1. PATCH `/api/exams/:id` status=PUBLISHED | Status updated |
| `TC-EXAM-004` | Get Exam for Student | Published exam | 1. GET `/api/exams/:id` | Return questions (without `isCorrect`) |
| `TC-EXAM-005` | Delete Exam | Exam exists | 1. DELETE `/api/exams/:id` | Exam removed |

### 2.2 Edge Cases

| TC-ID | Scenario | Steps | Expected Result |
| :--- | :--- | :--- | :--- |
| `TC-EXAM-006` | Duplicate Question | Add same question twice in `examQuestions` | Error or deduplicate |
| `TC-EXAM-007` | Empty Questions | Create exam with empty `questionIds` | Either reject or allow empty exam |
| `TC-EXAM-008` | Time Overrun | Update `startTime` > `endTime` | Validation error |

### 2.3 QA Scope for First Increment

Target feature: **Create Exam** (`/admin/exams/create` + `POST /exams`).

| Level | Coverage | Status |
| :--- | :--- | :--- |
| Unit | `ExamsService.create()` payload mapping and relation creation | Planned |
| Unit | `ExamsController.create()` teacher resolution and fallback logic | Planned |
| Integration | Payload shape from UI to API | Planned |
| UI | Mandatory validation: soal and rombel | Planned |
| Security | Role restriction and invalid teacher fallback | Planned |

### 2.4 Create Exam Test Cases

| TC-ID | Scenario | Pre-Condition | Steps | Expected Result |
| :--- | :--- | :--- | :--- | :--- |
| `TC-EXAM-CREATE-001` | Create exam sukses | Guru login, teacher tersedia | Isi form lengkap lalu submit | Exam tersimpan, redirect ke daftar ujian |
| `TC-EXAM-CREATE-002` | Tolak tanpa soal | Guru login | Submit tanpa memilih soal | Muncul error "Pilih minimal satu soal." |
| `TC-EXAM-CREATE-003` | Tolak tanpa rombel | Guru login | Submit tanpa memilih target peserta | Muncul error "Pilih minimal satu rombel target peserta." |
| `TC-EXAM-CREATE-004` | Mapping payload start/end time | Guru login | Submit form dengan tanggal dan waktu | API menerima `startTime` dan `endTime` ISO string |
| `TC-EXAM-CREATE-005` | Super admin fallback teacher | Super admin login, teacher user tidak ditemukan | Submit create exam | Exam dibuat memakai teacher pertama |
| `TC-EXAM-CREATE-006` | Teacher missing ditolak | Guru login tanpa record teacher | Submit create exam | 401 Unauthorized |

---

## 3. Students Module

### 3.1 Functional

| TC-ID | Scenario | Steps | Expected Result |
| :--- | :--- | :--- | :--- |
| `TC-STU-001` | Create Student | POST `/api/students` | 201 Created |
| `TC-STU-002` | List Students | GET `/api/students` | 200 OK + list |
| `TC-STU-003` | Delete Student | DELETE `/api/students/:id` | User + profile removed |

### 3.2 Security / Misuse

| TC-ID | Scenario | Steps | Expected Result |
| :--- | :--- | :--- | :--- |
| `TC-STU-004` | Duplicate NIS | Create same NIS twice | 409 Conflict |
| `TC-STU-005` | Weak Password | Check DB after creation | Password should be hashed, not plaintext `password123` |
| `TC-STU-006` | RBAC Bypass | SISWA user calls POST `/api/students` | 403 Forbidden (currently missing) |

---

## 4. Exam Sessions Module

### 4.1 Session Lifecycle

| TC-ID | Scenario | Steps | Expected Result |
| :--- | :--- | :--- | :--- |
| `TC-SESSION-001` | Start Session | POST `/api/exam-sessions/start` | 201 Created + session |
| `TC-SESSION-002` | Submit Answer | POST `/api/exam-sessions/answers` | Answer saved, score updated |
| `TC-SESSION-003` | Get Session | GET `/api/exam-sessions/:id` | 200 OK + answers & violations |
| `TC-SESSION-004` | Double Submit | Submit same question twice | Second submit rejected or overwrites atomically |

### 4.2 Race Conditions / Failures

| TC-ID | Scenario | Steps | Expected Result |
| :--- | :--- | :--- | :--- |
| `TC-SESSION-005` | Concurrent Submit | 2 simultaneous submit requests | Atomic save, no duplicates/corruption |
| `TC-SESSION-006` | Session Timeout | Idle for configured duration | Status: `LOCKED` |
| `TC-SESSION-007` | Network Drop | Disconnect during submit | Auto-save to localStorage, resume sync |

---

## 5. Question Bank & Questions Module

### 5.1 Import Flows

| TC-ID | Scenario | Steps | Expected Result |
| :--- | :--- | :--- | :--- |
| `TC-QBANK-001` | Import Valid Excel | Upload valid `.xlsx` | Questions created |
| `TC-QBANK-002` | Import Malformed | Upload corrupted file | Error with line number |
| `TC-QBANK-003` | Large Import | Import 10k questions | Queued via BullMQ (future) |

### 5.2 Security

| TC-ID | Scenario | Steps | Expected Result |
| :--- | :--- | :--- | :--- |
| `TC-QBANK-004` | Cross-user Access | User A accesses User B's bank | 403 Forbidden |

---

## 6. Realtime Gateway

### 6.1 Connection

| TC-ID | Scenario | Steps | Expected Result |
| :--- | :--- | :--- | :--- |
| `TC-RT-001` | Connect with JWT | Socket.IO handshake with valid token | Connected, room joined |
| `TC-RT-002` | Connect without JWT | No token | Connection rejected (currently missing) |

### 6.2 Events

| TC-ID | Scenario | Steps | Expected Result |
| :--- | :--- | :--- | :--- |
| `TC-RT-003` | Student Violation | Student triggers TAB_SWITCH | Event sent to teacher dashboard |
| `TC-RT-004` | Time Sync | Server sends ping every 30s | Client updates timer accurately |

---

## 7. Majors Module (Jurusan)

### 7.1 Functional

| TC-ID | Scenario | Steps | Expected Result |
| :--- | :--- | :--- | :--- |
| `TC-MAJ-001` | List Majors | GET `/api/majors` | 200 OK + data + total |
| `TC-MAJ-002` | Get Major Detail | GET `/api/majors/:id` | 200 OK + major + students |
| `TC-MAJ-003` | Create Major | POST `/api/majors` | 201 Created + major |
| `TC-MAJ-004` | Update Major | PUT `/api/majors/:id` | 200 OK + updated major |
| `TC-MAJ-005` | Delete Major | DELETE `/api/majors/:id` | 200 OK + success message |

### 7.2 Edge Cases / Security

| TC-ID | Scenario | Steps | Expected Result |
| :--- | :--- | :--- | :--- |
| `TC-MAJ-006` | Duplicate Name | Create major with same name | 400 Bad Request |
| `TC-MAJ-007` | Duplicate Code | Create major with same code | 400 Bad Request |
| `TC-MAJ-008` | Not Found | Access unknown major id | 404 Not Found |

---

## 8. Settings Module

### 7.1 Admin Only

| TC-ID | Scenario | Steps | Expected Result |
| :--- | :--- | :--- | :--- |
| `TC-SETT-001` | Get Settings | GET `/api/settings` | 200 OK + key-value pairs |
| `TC-SETT-002` | Update Setting | PATCH `/api/settings/:key` | 200 OK + updated value |
| `TC-SETT-003` | Non-Admin Blocked | Non-admin user tries update | 403 Forbidden (currently missing) |

---

## 9. Integration Test Scenarios (E2E)

| ITC-ID | Flow | Steps | Expected Result |
| :--- | :--- | :--- | :--- |
| `ITC-001` | Full Exam Lifecycle | 1. Guru creates questions<br>2. Creates exam<br>3. Publish<br>4. Siswa starts session<br>5. Answers all<br>6. Submit | All steps succeed, score computed |
| `ITC-002` | RBAC Escalation | Try all endpoints with each role | Proper 403 responses |
| `ITC-003` | Database Failure | Stop DB mid-session | 500/503 + graceful error |
| `ITC-004` | Concurrent Load | 100 students start exam | Server handles load, no 500 errors |

---

## 10. Performance Benchmarks (Targets)

| Endpoint | Method | Target <100ms | Target <500ms (100 rps) | Max Latency |
| :--- | :--- | :--- | :--- | :--- |
| `/api/exams` | GET | ✅ 50ms | ✅ 200ms | 500ms |
| `/api/exam-sessions/start` | POST | ❌ 300ms | ❌ 800ms | 1000ms |
| `/api/questions/:id` | GET | ✅ 40ms | ✅ 150ms | 500ms |
| Socket.io Handshake | WS | ✅ 20ms | ✅ 100ms | 200ms |

> **Baseline measurement** must be done using k6 or Artillery before Go-Live.

---

## 11. Security Test Vectors

| Vector | Description | Tool |
| :--- | :--- | :--- |
| **SQL Injection** | Inject payload in exam title | sqlmap |
| **XSS** | Inject script in question content | OWASP ZAP |
| **JWT Cracking** | Brute force weak secret | hashcat |
| **Path Traversal** | Upload with `../../../` filename | Manual |
| **CSRF** | POST without CSRF token | OWASP ZAP |