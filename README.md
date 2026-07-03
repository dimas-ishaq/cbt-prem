# CBT Enterprise

CBT (Computer-Based Test) Enterprise adalah platform ujian berbasis komputer monorepo berkinerja tinggi yang dirancang menggunakan arsitektur modern dan skalabel.

* **Backend:** NestJS + Prisma + PostgreSQL + Redis (Queue/Real-time)
* **Frontend:** Next.js + Chakra UI v3 + TailwindCSS

---

## 🛠️ Teknologi Utama

* **Runtime:** [Bun](https://bun.sh/) (Manajer paket & runtime berkecepatan tinggi)
* **Monorepo Tool:** [Turborepo](https://turbo.build/)
* **Database Relasional:** [PostgreSQL](https://www.postgresql.org/)
* **Cache & Message Broker:** [Redis](https://redis.io/)
* **ORM:** [Prisma ORM](https://www.prisma.io/)
* **UI Framework:** [Chakra UI v3](https://chakra-ui.com/)

---

## 📋 Prasyarat Sistem

Pastikan perangkat/server Anda telah terpasang:
* **Bun** >= 1.3 (Sangat disarankan) atau **Node.js** >= 20
* **Docker** & **Docker Compose** (Untuk mempermudah setup database & Redis)
* **PM2** (Opsional, untuk manajemen proses di lingkungan produksi)

---

## 🚀 Panduan Setup Infrastruktur (Via Docker)

Proyek ini telah menyediakan file `docker-compose.yml` di root direktori untuk menginisialisasi layanan aplikasi lengkap secara instan.

Jalankan perintah berikut di root direktori proyek untuk memulai seluruh stack:

```bash
docker compose up -d --build
```

Ini akan menginisialisasi kontainer berikut:
* **PostgreSQL:** Berjalan pada port `5432` dengan database `cbt_db`
* **Redis:** Berjalan pada port `6379`
* **API:** Berjalan pada port `3001`
* **Web:** Berjalan pada port `3000`

Jika hanya ingin infrastruktur data, compose juga tetap bisa dipakai untuk `postgres` dan `redis` saja.

### Kebutuhan sebelum build

Sebelum menjalankan `docker compose up -d --build`, pastikan nilai rahasia berikut sudah diganti:

```env
JWT_SECRET=...
JWT_REFRESH_SECRET=...
ENCRYPTION_KEY=...
```

Nilai default di compose hanya placeholder. Jangan pakai untuk produksi.

---

## ⚙️ Konfigurasi Lingkungan (Environment Variables)

Sebelum menjalankan aplikasi, salin file contoh environment di backend dan sesuaikan variabelnya.

### 1. Salin Template File `.env`
```bash
# Salin konfigurasi di aplikasi API (Backend)
cp apps/api/.env.example apps/api/.env

# Salin konfigurasi di aplikasi Web (Frontend)
cp apps/web/.env.example apps/web/.env
```

### 2. Konfigurasi Variabel API (`apps/api/.env`)
Pastikan variabel di bawah ini terisi dengan benar sesuai setup database Anda:

```env
# Koneksi Database PostgreSQL (Sesuaikan jika tidak menggunakan docker-compose)
DATABASE_URL="postgresql://cbtuser:cbtpassword@localhost:5432/cbt_db?schema=public"

# Koneksi Redis
REDIS_URL="redis://localhost:6379"

# Keamanan & Autentikasi
JWT_SECRET="ganti_dengan_jwt_secret_anda_yang_sangat_kuat"
ENCRYPTION_KEY="ganti_dengan_32_karakter_kunci_enkripsi_anda" # Wajib 32 karakter untuk AES-256

# Konfigurasi Server
PORT=3001
CORS_ORIGIN="http://localhost:3000"
```

### 3. Konfigurasi Variabel Web (`apps/web/.env`)
Konfigurasi alamat endpoint API untuk dihubungi oleh Next.js:

```env
# URL API Backend (Digunakan saat SSR)
NEXT_PUBLIC_API_URL="http://localhost:3001/api"
```

### 4. Jalankan dengan Docker

Untuk mode container, isi `apps/api/.env` dengan nilai produksi/rahasia, lalu jalankan:

```bash
docker compose up -d --build
```

Akses:
- Web: `http://localhost:3000`
- API: `http://localhost:3001/api`
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`

`docker-entrypoint.sh` di API akan menjalankan `prisma db push` saat container boot, jadi schema langsung sinkron sebelum server start.


---

## 💻 Panduan Instalasi & Menjalankan Aplikasi (Manual)

Setelah infrastruktur Docker aktif dan file `.env` telah disesuaikan, ikuti langkah berikut untuk menjalankan aplikasi:

### 1. Instalasi Dependensi
Jalankan perintah berikut di direktori root proyek:
```bash
bun install
```

### 2. Sinkronisasi Skema Database & Seed Data
Lakukan migrasi database untuk membuat tabel serta mengisi data awal (seperti akun administrator, mata pelajaran, rombel):
```bash
# Generate Prisma Client & Migrate DB
cd apps/api
bun x prisma db push
bun x prisma db seed
cd ../..
```

### 3. Menjalankan Mode Pengembangan (Development)
Untuk menjalankan seluruh aplikasi (web & api) secara bersamaan dalam mode pengembangan dengan fitur Hot Module Replacement (HMR):
```bash
bun run dev
```
Aplikasi akan tersedia pada:
* **Web Client (Frontend):** `http://localhost:3000`
* **API Server (Backend):** `http://localhost:3001/api`

---

## 📦 Kompilasi & Build Produksi

Untuk melakukan kompilasi aplikasi ke kode produksi yang dioptimalkan:

```bash
bun run build
```

Hasil kompilasi akan diletakkan pada:
* Backend: `apps/api/dist/`
* Frontend: `apps/web/.next/`

---

## 🌐 Panduan Deployment di Server Produksi (VPS)

Untuk menyebarkan aplikasi ke VPS Linux secara cepat, ikuti petunjuk berikut:

### 1. Persiapan Direktori di VPS
```bash
git clone <URL_REPOSITORI_ANDA> /opt/cbt-enterprise
cd /opt/cbt-enterprise
```

### 2. Salin dan Konfigurasikan `.env`
Salin dan lengkapi file `.env` di `apps/api/.env` dan `apps/web/.env` menggunakan kredensial produksi yang aman.

### 3. Jalankan Script Deployment Otomatis
Kami telah menyediakan skrip automasi deploy yang akan menginstal dependensi, mem-build aplikasi, menjalankan migrasi database, dan menyalakan server via PM2:

```bash
# Berikan izin eksekusi pada script helper
chmod +x scripts/deploy.sh
chmod +x scripts/stop.sh

# Eksekusi deployment
./scripts/deploy.sh
```

### 4. Menghentikan Layanan di VPS
Untuk mematikan seluruh proses aplikasi yang dikelola oleh PM2:
```bash
./scripts/stop.sh
```

---

## 📂 Struktur Direktori Proyek

```
cbt-prem/
  ├── apps/
  │    ├── api/           # Backend application (NestJS)
  │    │    ├── Dockerfile
  │    │    └── docker-entrypoint.sh
  │    └── web/           # Frontend application (Next.js)
  │         └── Dockerfile
  ├── packages/
  │    ├── eslint-config/ # Konfigurasi Eslint bersama
  │    ├── typescript-config/ # Konfigurasi TS bersama
  │    └── ui/            # UI Components bersama
  ├── scripts/
  │    ├── deploy.sh      # Script deployment VPS
  │    └── stop.sh        # Script penghenti proses VPS
  ├── docker-compose.yml  # Setup full-stack (PostgreSQL, Redis, API, Web)
  ├── .dockerignore
  └── package.json        # Manifest utama monorepo
```

---

## 🔒 Catatan Keamanan Produksi

* Jangan pernah menyertakan berkas `.env` atau folder `node_modules/`, `.next/`, `dist/`, `logs/`, dan `/uploads/` ke dalam commit Git Anda (sudah otomatis diamankan dalam `.gitignore`).
* Harap segera mengganti `JWT_SECRET` and `ENCRYPTION_KEY` bawaan dengan nilai rahasia acak yang panjang di lingkungan produksi demi mencegah peretasan token ujian.
