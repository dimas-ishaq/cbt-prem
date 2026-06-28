#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

[ -f apps/api/.env ] || { echo "missing apps/api/.env" >&2; exit 1; }

cd "$ROOT_DIR/apps/api"
bunx prisma db seed

echo "✅ Seed selesai."
