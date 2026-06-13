# Setup Guide (Local Development)

Panduan ini ditujukan bagi developer yang ingin menjalankan aplikasi CBT Enterprise di mesin lokal.

## Prasyarat
1.  **Node.js** (Minimal versi 18.x)
2.  **PostgreSQL** (Berjalan di lokal atau remote, default port 5432)
3.  **Git**

## Langkah-langkah Instalasi

### 1. Clone Repository
```bash
git clone <url-repository>
cd cbt-enterprise
```

### 2. Install Dependencies
Proyek ini menggunakan Turborepo dengan `npm` workspaces.
```bash
npm install
```

### 3. Konfigurasi Environment Variables
Masuk ke direktori `apps/api` dan buat file `.env`.
```bash
cd apps/api
cp .env.example .env
```
Pastikan `DATABASE_URL` menunjuk ke server PostgreSQL Anda. Contoh:
`DATABASE_URL="postgresql://user:password@localhost:5432/cbt_db?schema=public"`

### 4. Inisialisasi Database
Jalankan migrasi Prisma untuk membuat tabel di database.
```bash
npx prisma db push
# atau
npx prisma migrate dev
```

### 5. Jalankan Aplikasi
Kembali ke *root directory* `cbt-enterprise` dan jalankan Turborepo.
```bash
cd ../..
npm run dev
```
Perintah ini akan menjalankan secara paralel:
*   **Backend (NestJS API):** `http://localhost:3001`
*   **Frontend (Next.js Web):** `http://localhost:3000`

## Akses Aplikasi
*   Buka `http://localhost:3000` di browser.
*   Gunakan akun Super Admin (buat via database/seeder jika belum ada) untuk login pertama kali.
