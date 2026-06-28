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

[ -f .env ] || [ -f apps/api/.env ] || { echo "missing env file" >&2; exit 1; }

if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  . ./.env
  set +a
fi

bun install --frozen-lockfile
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
$PM2_BIN start --name cbt-web --time --update-env --cwd apps/web --interpreter bash -- -lc 'bun run start'
$PM2_BIN save
$PM2_BIN status
