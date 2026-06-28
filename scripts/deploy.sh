#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

export NODE_ENV="production"
export CI="true"

need() { command -v "$1" >/dev/null 2>&1 || { echo "missing: $1" >&2; exit 1; }; }
need bun
need psql

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

if command -v pm2 >/dev/null 2>&1; then
  pm2 delete cbt-api >/dev/null 2>&1 || true
  pm2 delete cbt-web >/dev/null 2>&1 || true
  pm2 start apps/api/dist/main.js --name cbt-api --time --update-env
  pm2 start "bun run start --filter=web" --name cbt-web --time --update-env
  pm2 save
  pm2 status
  exit 0
fi

mkdir -p logs
nohup bun run start:api > logs/api.log 2>&1 &
printf '%s\n' "$!" > logs/api.pid
nohup bun run start:web > logs/web.log 2>&1 &
printf '%s\n' "$!" > logs/web.pid

echo "started"
