#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "=== 1. Pull latest ==="
git pull

echo "=== 2. Setup env ==="
[ -f apps/api/.env ] || cp apps/api/.env.example apps/api/.env
[ -f apps/web/.env.local ] || cp apps/web/.env.example apps/web/.env.local

set -a
# shellcheck disable=SC1091
. apps/api/.env
set +a

echo "=== 3. Install ==="
bun install --frozen-lockfile

echo "=== 4. Prisma generate ==="
cd apps/api && bunx prisma generate && cd "$ROOT_DIR"

echo "=== 5. Build ==="
bunx turbo run build --filter=api --filter=web

echo "=== 6. Migrate ==="
cd apps/api && bunx prisma migrate deploy && cd "$ROOT_DIR"

echo "=== 7. Start ==="
PM2_BIN="pm2"
command -v pm2 >/dev/null 2>&1 || PM2_BIN="bunx pm2"

$PM2_BIN delete cbt-api >/dev/null 2>&1 || true
$PM2_BIN delete cbt-web >/dev/null 2>&1 || true
$PM2_BIN start apps/api/dist/main.js --name cbt-api --time --update-env
$PM2_BIN start bash --name cbt-web --time -- -lc "cd apps/web && NEXT_PUBLIC_APP_URL=${FRONTEND_URL:-https://novatech.biz.id} NEXT_PUBLIC_API_URL=${PUBLIC_API_URL:-https://novatech.biz.id/api} NEXT_PUBLIC_WS_URL=${PUBLIC_WS_URL:-https://novatech.biz.id} bunx next start -p 3000"
$PM2_BIN save

$PM2_BIN status
echo "=== Done ==="
