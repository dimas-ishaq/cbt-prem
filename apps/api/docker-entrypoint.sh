#!/bin/sh
set -e

mkdir -p /app/uploads
chown -R appuser:appgroup /app/uploads

echo "→ Syncing database schema..."
su-exec appuser bunx prisma db push --skip-generate --accept-data-loss

echo "→ Database ready."
exec su-exec appuser "$@"
