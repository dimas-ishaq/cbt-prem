# Software Requirements Specification (SRS)

## 1. Pendahuluan
Dokumen ini merangkum seluruh kebutuhan sistem (System Requirements) untuk aplikasi CBT Enterprise.

## 2. Kebutuhan Fungsional (Functional Requirements)
### 2.1 Manajemen Pengguna & Autentikasi
*   **FR-1.1:** Sistem harus mengizinkan login berbasis peran (Siswa, Guru, Admin).
*   **FR-1.2:** Admin dapat menambahkan Siswa (dengan NISN) dan Guru (dengan NIP).
*   **FR-1.3:** Sistem menggunakan JWT (JSON Web Token) untuk proteksi endpoint.

### 2.2 Manajemen Bank Soal
*   **FR-2.1:** Guru dapat membuat Bank Soal berdasarkan Mata Pelajaran.
*   **FR-2.2:** Guru dapat menambahkan soal dengan tipe: Pilihan Ganda, Benar/Salah, Multiple Response, dan Essay.
*   **FR-2.3:** Sistem menyediakan WYSIWYG Editor untuk format teks dan input URL media (Gambar/Audio/Video).
*   **FR-2.4:** Guru dapat mengimpor soal secara massal dari file `.docx` dengan format tag `SQ` dan `EQ`.

### 2.3 Pelaksanaan Ujian & Proctoring
*   **FR-3.1:** Siswa dapat melihat daftar ujian yang aktif dan memulai ujian menggunakan token/password.
*   **FR-3.2:** Sistem secara otomatis mendeteksi jika siswa berpindah tab (visibility hidden) atau berpindah aplikasi (window blur).
*   **FR-3.3:** Guru memiliki dashboard "Live Proctoring" yang menampilkan status online/offline siswa, persentase progres, dan log peringatan kecurangan secara realtime via WebSocket.

### 2.4 Penilaian & Pelaporan
*   **FR-4.1:** Sistem secara otomatis menghitung nilai untuk soal non-essay saat siswa menyelesaikan ujian.
*   **FR-4.2:** Guru dapat memberikan nilai secara manual untuk soal bertipe Essay.
*   **FR-4.3:** Admin/Guru dapat mengekspor rekap hasil ujian dalam bentuk file Excel (.xlsx).

## 3. Kebutuhan Non-Fungsional (Non-Functional Requirements)
*   **NFR-1 (Performa):** UI menggunakan SSR/CSR (Next.js) yang dioptimasi untuk kecepatan respons.
*   **NFR-2 (Keamanan):** Sandi di-hash menggunakan bcrypt. Token ujian diamankan di backend.
*   **NFR-3 (Skalabilitas):** Arsitektur dipisah antara backend (NestJS) dan frontend (Next.js) menggunakan Turborepo monorepo, memudahkan penskalaan independen.
