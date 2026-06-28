#!/usr/bin/env bash
set -euo pipefail

if command -v pm2 >/dev/null 2>&1; then
  pm2 delete cbt-api cbt-web >/dev/null 2>&1 || true
else
  [ -f logs/api.pid ] && kill "$(cat logs/api.pid)" 2>/dev/null || true
  [ -f logs/web.pid ] && kill "$(cat logs/web.pid)" 2>/dev/null || true
fi

echo "stopped"
