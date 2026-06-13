# Database Design (Prisma Schema)

Struktur database dirancang relasional menggunakan Prisma ORM. Berikut adalah entitas utama dan relasinya:

## 1. Entitas Pengguna & Otorisasi
*   **User:** Tabel inti yang menyimpan `username`, `password` (hashed), dan `role` (SUPER_ADMIN, ADMIN_SEKOLAH, GURU, SISWA).
*   **Student:** Ekstensi dari tabel User, menyimpan `nisn`. Terhubung 1-to-1 dengan `User`.
*   **Teacher:** Ekstensi dari tabel User, menyimpan `nip`. Terhubung 1-to-1 dengan `User`.

## 2. Entitas Soal & Akademik
*   **Subject:** Mata pelajaran. Memiliki relasi 1-to-N dengan `QuestionBank` dan `Exam`.
*   **QuestionBank:** Wadah untuk mengelompokkan soal (milik seorang Guru dan Mata Pelajaran tertentu).
*   **Question:** Data soal. Terdapat field `type` (PILIHAN_GANDA, ESSAY, dll), `content`, `mediaUrl`, `mediaType`, `points`.
*   **QuestionOption:** Pilihan jawaban untuk suatu soal. Terdapat field `isCorrect`. (Tidak berlaku untuk soal Essay).

## 3. Entitas Pelaksanaan Ujian (Exam Engine)
*   **Exam:** Representasi dari jadwal ujian. Berisi konfigurasi ujian seperti `startTime`, `endTime`, `duration`, `token`, `status`. Terhubung M-to-N dengan `Question` (melalui tabel pivot `ExamQuestion`).
*   **ExamSession:** Sesi ujian spesifik untuk seorang siswa. Mencatat waktu mulai, waktu selesai, `status` sesi, dan total `score`. Tabel inilah yang memastikan seorang siswa hanya mengerjakan satu kali.
*   **Answer:** Jawaban spesifik siswa per soal. Menyimpan `selectedOption` atau `essayAnswer`, serta `score` (jika sudah dinilai).
*   **Violation:** Log pelanggaran (proctoring). Terhubung ke `ExamSession`. Menyimpan jenis kecurangan (`TAB_SWITCH`, `WINDOW_BLUR`) dan `timestamp`.

## Diagram Relasi Kasar (ERD Conceptual)
```text
User 1--1 Student/Teacher
Teacher 1--N QuestionBank
Subject 1--N QuestionBank / Exam
QuestionBank 1--N Question
Question 1--N QuestionOption
Exam 1--N ExamQuestion N--1 Question
Exam 1--N ExamSession N--1 Student
ExamSession 1--N Answer
ExamSession 1--N Violation
```
