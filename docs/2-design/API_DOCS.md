# API Documentation

Aplikasi ini menggunakan REST API standar berbasis JSON yang di-hosting pada `http://localhost:3001/api`.
*Semua endpoint kecuali `/auth/login` memerlukan Header `Authorization: Bearer <token>`.*

## 1. Authentication (`/auth`)
*   `POST /auth/login`
    *   **Body:** `{ username, password }`
    *   **Response:** `{ access_token, user: { id, role, ... } }`

## 2. Exam Sessions & Grading (`/exam-sessions`)
*   `POST /exam-sessions/start`
    *   **Body:** `{ examId, token? }`
    *   **Description:** Memulai sesi ujian.
*   `POST /exam-sessions/:id/submit-answer`
    *   **Body:** `{ questionId, selectedOptionId?, essayAnswer? }`
    *   **Description:** Mengirim atau memperbarui jawaban siswa.
*   `POST /exam-sessions/:id/finish`
    *   **Description:** Mengakhiri ujian dan memicu fungsi auto-grading.
*   `PATCH /exam-sessions/answers/:answerId/grade`
    *   **Body:** `{ score: number }`
    *   **Description:** Memberikan nilai manual pada jawaban spesifik (essay).

## 3. Reporting (`/exam-sessions/exam/:examId/export`)
*   `GET /exam-sessions/exam/:examId/export`
    *   **Response:** File buffer berformat `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` (XLSX).

## 4. Question Importer (`/questions/import/:bankId`)
*   `POST /questions/import/:bankId`
    *   **Content-Type:** `multipart/form-data`
    *   **Body:** `file` (.docx)
    *   **Description:** Mengunggah file word untuk dikonversi menjadi soal CBT secara massal.

## 5. WebSockets Events (Namespace: default)
*   **Emit `join_exam`:** Join room ujian (Siswa).
*   **Emit `join_proctor`:** Join room pengawas (Guru).
*   **Emit `violation_detected`:** Laporan kecurangan dari client siswa.
*   **Listen `violation_alert`:** Diterima guru saat siswa curang.
*   **Listen `student_offline`:** Diterima guru jika siswa terputus koneksinya.
