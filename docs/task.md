# Rencana Kerja Terperinci: Implementasi Fitur CBT Premium & Professional

Dokumen ini berisi daftar tugas bertahap (step-by-step) untuk memandu pengembangan fitur premium. Setiap tahap dirancang agar memiliki batasan file dan alur yang jelas.

---

## 📋 DAFTAR TUGAS DAN CHECKLIST

### 🛠️ TAHAP 1: Konfigurasi Redis & BullMQ Opsional (Superadmin Settings)
Tujuan: Menyediakan antarmuka bagi Superadmin untuk mengaktifkan Redis, melakukan pengujian koneksi, dan meng-load adaptor BullMQ secara dinamis dengan panduan penggunaan.

- `[x]` **1.1. Konfigurasi Backend & Penyimpanan Pengaturan (NestJS)**
  - `[x]` Perbarui default settings di [settings.service.ts](file:///g:/Project/Javascript/cbt-prem/apps/api/src/settings/settings.service.ts) untuk mendefinisikan kunci baru: `redisEnabled` ("true"/"false"), `redisHost`, `redisPort`, dan `redisPassword`.
  - `[x]` Buat controller endpoint `POST /settings/redis/sync` di [settings.controller.ts](file:///g:/Project/Javascript/cbt-prem/apps/api/src/settings/settings.controller.ts) yang mencoba koneksi Redis dengan ioredis dan menyimpan pengaturan ke database.
- `[x]` **1.2. Antarmuka UI Pengaturan Redis di Frontend (Next.js & Chakra UI v3)**
  - `[x]` Buka [settings/page.tsx](file:///g:/Project/Javascript/cbt-prem/apps/web/app/(teacher)/admin/settings/page.tsx) dan tambahkan Card UI baru: **"Integrasi Redis & BullMQ (Opsional)"**.
  - `[x]` Buat form input untuk Toggle, Host, Port, Password.
  - `[x]` Implementasikan tombol **"Uji & Sinkronkan Koneksi"** yang memanggil API backend dengan state loading dan toaster notification.
- `[x]` **1.3. Panduan Penggunaan Langsung di UI**
  - `[x]` Tambahkan panel edukatif / tooltip di bawah form Redis yang menjelaskan fungsi Redis + BullMQ serta status aktif/nonaktif saat ini.

---

### 📊 TAHAP 2: Laporan & Analisis Ujian Visual (Exam Analytics & Server-Side PDF)
Tujuan: Menampilkan visualisasi data kelulusan, distribusi nilai, analisis butir soal untuk guru, serta ekspor file PDF resmi dari server.

- `[x]` **2.1. API Agregasi & Analitik Nilai Ujian (NestJS)**
  - `[x]` Buat service method `analytics(id)` di [exams.service.ts](file:///g:/Project/Javascript/cbt-prem/apps/api/src/exams/exams.service.ts) untuk mengalkulasi total ketuntasan KKM, rata-rata kelas, distribusi kelompok nilai, dan tingkat kesulitan soal.
  - `[x]` Daftarkan endpoint `GET /exams/:id/analytics` di [exams.controller.ts](file:///g:/Project/Javascript/cbt-prem/apps/api/src/exams/exams.controller.ts).
- `[x]` **2.2. Generator PDF Hasil Ujian Server-Side (NestJS)**
  - `[x]` Implementasikan endpoint `GET /exams/:id/analytics/pdf` yang menghasilkan stream file PDF formal menggunakan `pdfkit` memuat kop logo, tabel kelulusan, dan tanda tangan guru.
- `[x]` **2.3. Halaman Analytics Dashboard di Frontend (Next.js & Recharts)**
  - `[x]` Buat halaman baru di [results/[id]/analytics/page.tsx](file:///g:/Project/Javascript/cbt-prem/apps/web/app/(teacher)/admin/results/[id]/analytics/page.tsx).
  - `[x]` Tampilkan grafik ringkasan menggunakan `recharts` (Bar Chart distribusi nilai, Pie Chart rasio kelulusan KKM).
  - `[x]` Buat tabel *Item Analysis* tingkat kesulitan butir soal (Mudah, Sedang, Sulit).
  - `[x]` Integrasikan tombol **"Ekspor Laporan PDF"** yang memicu download PDF dari server endpoint.
  - `[x]` Hubungkan halaman dengan menambahkan tombol **"Analisis Grafik"** pada halaman utama list hasil ujian [results/[id]/page.tsx](file:///g:/Project/Javascript/cbt-prem/apps/web/app/(teacher)/admin/results/[id]/page.tsx).

---

### ✏️ TAHAP 3: Antarmuka Penilaian Essay Kolektif (Manual Essay Grading)
Tujuan: Mengaktifkan fungsionalitas penilaian manual bagi soal tipe essay secara cepat dan terpusat untuk guru.

- `[x]` **Tahap 3: Antarmuka Penilaian Essay Kolektif (Manual Essay Grading)**
  - `[x]` Penyesuaian Skema Database & Migrasi (Prisma): Tambah field `isGraded Boolean @default(false)` dan `score Float?` pada model `Answer`.
  - `[x]` API Modul Penilaian Essay (NestJS): Mengimplementasikan `getEssayAnswersByExam(examId)` dan `gradeEssayAnswer(answerId, dto)` di [exam-sessions.service.ts](file:///g:/Project/Javascript/cbt-prem/apps/api/src/exam-sessions/exam-sessions.service.ts).
  - `[x]` Halaman Portal Penilaian Essay di Frontend (Next.js): Membuat antarmuka penelaahan kolektif split-screen di [essay-grading/page.tsx](file:///g:/Project/Javascript/cbt-prem/apps/web/app/(teacher)/admin/results/[id]/essay-grading/page.tsx).

---

### 🛡️ TAHAP 4: Live Monitor Pengawas (Live Proctoring Dashboard)
Tujuan: Menyediakan alat bagi pengawas ujian untuk memantau status fokus siswa secara realtime dan melakukan tindakan kendali jarak jauh (remote actions).

- `[x]` **4.1. Handler Event WebSocket (NestJS Gateway)**
  - `[x]` Hubungkan event socket di [realtime.gateway.ts](file:///g:/Project/Javascript/cbt-prem/apps/api/src/realtime/realtime.gateway.ts) untuk mengelola ruang pengawasan (`join_proctor_room`), mendengarkan pelanggaran (`violation_detected`), dan melakukan aksi remote session lock.
- `[x]` **4.2. UI Dashboard Pengawas Realtime (Next.js)**
  - `[x]` Gunakan antarmuka yang sudah ada di [monitoring/page.tsx](file:///g:/Project/Javascript/cbt-prem/apps/web/app/(teacher)/admin/monitoring/page.tsx) dan [monitoring/[id]/page.tsx](file:///g:/Project/Javascript/cbt-prem/apps/web/app/(teacher)/admin/monitoring/[id]/page.tsx) untuk menampilkan grid peserta live, log ticker pelanggaran, dan kontrol blokir/reset sesi siswa secara realtime.
