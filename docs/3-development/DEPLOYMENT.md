# Deployment Guide

Panduan untuk merilis aplikasi CBT Enterprise ke server produksi.

## Menggunakan Docker Compose (Recommended)

Proyek ini telah dilengkapi dengan `docker-compose.yml` di *root directory*. Ini adalah cara termudah dan paling standar untuk deployment.

### 1. Persiapan Server
Pastikan server Anda (VPS/Cloud) sudah terinstal:
*   Docker
*   Docker Compose

### 2. Persiapan File Environment
Buat file `.env` di *root directory* (atau gunakan system env vars) yang berisi kredensial production:
```env
DATABASE_URL="postgresql://postgres:securepassword@db:5432/cbt_prod?schema=public"
JWT_SECRET="super-secret-production-key"
```

### 3. Build & Run
Jalankan perintah berikut di lokasi file `docker-compose.yml`:
```bash
docker-compose up -d --build
```

### 4. Apa yang Terjadi?
Docker Compose akan mengangkat 3 kontainer utama:
1.  **db (PostgreSQL):** Database server.
2.  **api (NestJS Backend):** Berjalan di port 3001. Koneksi socket.io dan REST API ditangani di sini.
3.  **web (Next.js Frontend):** Berjalan di port 3000. 

### 5. Konfigurasi Nginx (Reverse Proxy)
Sangat disarankan untuk menempatkan Nginx di depan aplikasi `web` dan `api` untuk menangani SSL (HTTPS) dan mapping domain.
*   Arahkan `cbt.domain.com` ke port `3000`.
*   Arahkan `api.cbt.domain.com` ke port `3001`. (Pastikan Next.js dikonfigurasi untuk memanggil URL API ini).
