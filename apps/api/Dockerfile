# ============================================================
# CBT Enterprise — API (NestJS)
# Multi-stage build: oven/bun → install → build → run
# ============================================================

# ─── Base stage ──────────────────────────────────────────────
FROM oven/bun:1.3-alpine AS base
WORKDIR /app

COPY package.json bun.lock turbo.json tsconfig.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/ packages/
COPY apps/api/prisma apps/api/prisma
COPY apps/api/tsconfig*.json apps/api/
COPY apps/api/nest-cli.json apps/api/
COPY apps/api/.env.example apps/api/
COPY apps/api/src apps/api/src
COPY apps/api/test apps/api/test
COPY apps/api/eslint.config.mjs apps/api/
COPY apps/api/tsconfig.json apps/api/
COPY apps/api/README.md apps/api/
COPY apps/api/docker-entrypoint.sh apps/api/

RUN bun install --frozen-lockfile 2>/dev/null || bun install

# ─── Build stage ─────────────────────────────────────────────
FROM base AS build
WORKDIR /app

COPY apps/api/ apps/api/

RUN cd apps/api && bunx prisma generate && bun run build

# ─── Runner stage ────────────────────────────────────────────
FROM oven/bun:1.3-alpine AS runner
WORKDIR /app

RUN apk add --no-cache su-exec
RUN addgroup -S -g 1001 appgroup && adduser -S -u 1001 -G appgroup appuser

COPY --from=build /app/apps/api/dist         ./dist
COPY --from=build /app/apps/api/prisma       ./prisma
COPY --from=build /app/apps/api/package.json ./
COPY --from=build /app/node_modules          ./node_modules
COPY --from=build /app/apps/api/node_modules/.prisma ./node_modules/.prisma
COPY apps/api/docker-entrypoint.sh /docker-entrypoint.sh

RUN chmod +x /docker-entrypoint.sh

ENV NODE_ENV=production \
    PORT=3001

EXPOSE 3001
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["node", "dist/main"]
