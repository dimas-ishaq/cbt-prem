# System Architecture

## 1. Arsitektur Umum
Aplikasi CBT Enterprise dibangun menggunakan arsitektur **Client-Server** dengan pola **Monorepo** (dikelola oleh Turborepo). Hal ini memungkinkan berbagi konfigurasi (TS, ESLint) di seluruh ekosistem.

```text
[ Client / Browser ] <--- HTTP/REST & WebSockets ---> [ API Server ] <---> [ Database ]
     (Next.js)                                          (NestJS)         (PostgreSQL)
```

## 2. Komponen Sistem
### 2.1 Frontend (Apps: Web)
*   **Framework:** Next.js (App Router).
*   **Styling:** Tailwind CSS & Lucide Icons.
*   **Data Fetching:** React Query (@tanstack/react-query).
*   **Tugas Utama:** Merender antarmuka pengguna (Dashboard Siswa, Panel Admin/Guru, Interface Ujian).

### 2.2 Backend (Apps: API)
*   **Framework:** NestJS.
*   **Transport:** REST API (Controllers) & WebSockets (Socket.io Gateway).
*   **ORM:** Prisma.
*   **Tugas Utama:** Autentikasi, logika bisnis (grading, import), validasi data, komunikasi realtime.

### 2.3 Database
*   **Engine:** PostgreSQL.
*   **Manajemen Skema:** Prisma Migrations.

### 2.4 Komunikasi Realtime (Live Proctoring)
Menggunakan arsitektur Pub/Sub (Socket.io). 
1. Client (Siswa) mendeteksi event browser (`blur`, `visibilitychange`).
2. Client mengirim event `violation_detected` ke Server.
3. Server memvalidasi, menyimpan ke database, dan membroadcast `violation_alert` ke *room* spesifik (`proctor_examId`).
4. Client (Guru) menerima alert dan memperbarui UI.

## 3. Infrastruktur & Deployment
Aplikasi dirancang agar mudah di-deploy menggunakan **Docker**. File `docker-compose.yml` disertakan untuk mengangkat PostgreSQL, Redis (opsional untuk scaling WebSocket), Backend, dan Frontend secara bersamaan.
