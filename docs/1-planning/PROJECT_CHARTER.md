# Project Charter: CBT Enterprise

## 1. Informasi Proyek
*   **Nama Proyek:** Aplikasi Computer Based Test (CBT) Enterprise
*   **Deskripsi:** Platform ujian online berbasis web yang dirancang untuk skala sekolah dan institusi dengan fitur pengawasan (proctoring) realtime, manajemen soal multimedia, dan auto-grading.
*   **Teknologi Utama:** TypeScript, Turborepo, NestJS (Backend), Next.js (Frontend), Prisma ORM, PostgreSQL, Socket.io.

## 2. Latar Belakang & Tujuan
Institusi pendidikan membutuhkan sistem ujian yang tidak hanya mampu menampung soal pilihan ganda biasa, tetapi juga format soal kompleks (essay, multiple response, benar/salah) beserta multimedia. Selain itu, diperlukan sistem pengawasan ujian yang ketat untuk mendeteksi kecurangan secara realtime (tab-switching, window-blur). Proyek ini bertujuan untuk menyediakan solusi terintegrasi end-to-end dari pembuatan soal hingga pelaporan nilai.

## 3. Ruang Lingkup Proyek (In-Scope)
*   Manajemen Pengguna (Super Admin, Admin Sekolah, Guru, Siswa).
*   Manajemen Mata Pelajaran dan Bank Soal (mendukung Import DOCX).
*   Rich Text Editor & Multimedia untuk pembuat soal.
*   Dashboard Pelaksanaan Ujian untuk Siswa.
*   Live Proctoring Dashboard (Realtime) untuk Guru.
*   Auto-grading dan Penilaian Manual (Essay).
*   Export Hasil Ujian ke format Excel (XLSX).

## 4. Kriteria Kesuksesan
*   Aplikasi dapat di-deploy dengan Docker.
*   Sistem mampu mendeteksi dan melaporkan kecurangan secara seketika (latency rendah).
*   Guru dapat mengimpor 100+ soal dari Word dalam satu kali proses.
*   Laporan nilai akurat dan sesuai dengan logika perhitungan tiap jenis soal.
