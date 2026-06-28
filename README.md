# CBT Enterprise

Monorepo CBT (Computer-Based Test) Enterprise.  
Backend: NestJS + Prisma + PostgreSQL.  
Frontend: Next.js + Chakra UI v3.

## Stack
- Bun
- Turbo
- NestJS
- Next.js
- Prisma
- PostgreSQL
- Chakra UI v3
- Redis (queue/real-time)

## Prasyarat
- Bun >= 1.3
- PostgreSQL >= 15
- Redis >= 7

## Setup lokal

```bash
cd cbt-prem
bun install

cp apps/api/.env.example apps/api/.env
# edit env: DATABASE_URL, JWT_SECRET, CORS_ORIGIN, REDIS_URL

bun run dev
```

API: `http://localhost:3001/api`  
Web: `http://localhost:3000`

## Build production

```bash
bun run build
```

## Test

```bash
# type check
bun run check-types

# lint
bun run lint

# unit test
cd apps/api && bunx jest --runInBand --forceExit

# e2e test
cd apps/api && bunx jest --config ./test/jest-e2e.json --runInBand --forceExit
```

## Deploy VPS

### 1. Clone repo
```bash
git clone <url> /opt/cbt
cd /opt/cbt
cp apps/api/.env.example apps/api/.env
# isi env
```

### 2. Jalankan script
```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

Script akan:
- install dependency
- build app
- jalankan Prisma migrate
- start API + web via pm2 (atau nohup fallback)

### 3. Hentikan service
```bash
./scripts/stop.sh
```

## Struktur direktori

```
cbt-prem/
  apps/
    api/           # NestJS API
    web/           # Next.js frontend
  packages/
    ui/            # shared component
    eslint-config/ # shared eslint
    typescript-config/
  scripts/
    deploy.sh
    stop.sh
  docs/            # project documentation
```

## Catatan deploy
- Wajib ada `.env` sebelum deploy
- PM2 recommended produksi (install global: `npm i -g pm2`)
- Log ada di `logs/`
- Upload file ada di `apps/api/uploads/`

## Do not commit
- `.env`
- `node_modules/`
- `.next/`
- `.turbo/`
- `dist/`
- `coverage/`
- `apps/api/uploads/`
- log files
- test-results/
