#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

export NODE_ENV="production"
export CI="true"

need() { command -v "$1" >/dev/null 2>&1 || { echo "missing: $1" >&2; exit 1; }; }
need bun
need psql

PM2_BIN="pm2"
if ! command -v pm2 >/dev/null 2>&1; then
  PM2_BIN="bunx pm2"
fi

[ -f apps/api/.env ] || cp apps/api/.env.example apps/api/.env
[ -f apps/web/.env.local ] || cp apps/web/.env.example apps/web/.env.local

set -a
# shellcheck disable=SC1091
. apps/api/.env
set +a

bun install --frozen-lockfile

mkdir -p apps/web
cat > apps/web/.env.local <<EOF
NEXT_PUBLIC_APP_URL=${FRONTEND_URL:-https://novatech.biz.id}
NEXT_PUBLIC_API_URL=${PUBLIC_API_URL:-https://novatech.biz.id/api}
NEXT_PUBLIC_WS_URL=${PUBLIC_WS_URL:-https://novatech.biz.id}
NEXT_PUBLIC_DEBUG=false
EOF

cd apps/api
bunx prisma generate
cd "$ROOT_DIR"
bunx turbo run build --filter=api --filter=web

cd apps/api
bunx prisma migrate deploy
cd "$ROOT_DIR"

$PM2_BIN delete cbt-api >/dev/null 2>&1 || true
$PM2_BIN delete cbt-web >/dev/null 2>&1 || true
$PM2_BIN start apps/api/dist/main.js --name cbt-api --time --update-env
$PM2_BIN start bash --name cbt-web --time --update-env -- -lc "cd apps/web && PORT=3000 bun run start"
$PM2_BIN save
$PM2_BIN status
