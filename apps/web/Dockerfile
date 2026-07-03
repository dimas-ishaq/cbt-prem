# ============================================================
# CBT Enterprise — Web (Next.js)
# Multi-stage build: oven/bun → install → build → run
# ============================================================

# ─── Build-time args ─────────────────────────────────────────
ARG NEXT_PUBLIC_API_URL=http://localhost:3001/api
ARG NEXT_PUBLIC_WS_URL=http://localhost:3001
ARG NEXT_PUBLIC_APP_URL=http://localhost:3000
ARG NEXT_PUBLIC_DEBUG=false

# ─── Base stage ──────────────────────────────────────────────
FROM oven/bun:1.3-alpine AS base
WORKDIR /app

COPY package.json bun.lock turbo.json tsconfig.json ./
COPY apps/web/package.json apps/web/package.json
COPY packages/ packages/

RUN bun install --frozen-lockfile 2>/dev/null || bun install

# ─── Build stage ─────────────────────────────────────────────
FROM base AS build
WORKDIR /app

ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_WS_URL
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_DEBUG

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL \
    NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL \
    NEXT_PUBLIC_DEBUG=$NEXT_PUBLIC_DEBUG

COPY apps/web/app apps/web/app
COPY apps/web/src apps/web/src
COPY apps/web/public apps/web/public
COPY apps/web/next.config.js apps/web/
COPY apps/web/tsconfig.json apps/web/
COPY apps/web/postcss.config.js apps/web/
COPY apps/web/eslint.config.js apps/web/
COPY apps/web/playwright.config.ts apps/web/
COPY apps/web/proxy.ts apps/web/
COPY apps/web/.env.example apps/web/
COPY apps/web/README.md apps/web/
COPY apps/web/e2e apps/web/e2e/
COPY apps/web/tests apps/web/tests/
COPY apps/web/src/lib/env.ts apps/web/src/lib/
COPY apps/web/src/lib/api.ts apps/web/src/lib/
COPY apps/web/src/lib/theme.ts apps/web/src/lib/
COPY apps/web/src/lib/i18n.ts apps/web/src/lib/
COPY apps/web/src/lib/exam-utils.ts apps/web/src/lib/
COPY apps/web/src/lib/pdf-helper.ts apps/web/src/lib/
COPY apps/web/src/components/providers.tsx apps/web/src/components/
COPY apps/web/src/components/theme-script.tsx apps/web/src/components/
COPY apps/web/src/components/emotion-registry.tsx apps/web/src/components/
COPY apps/web/src/components/ui apps/web/src/components/ui
COPY apps/web/src/components/form apps/web/src/components/form
COPY apps/web/src/components/admin apps/web/src/components/admin
COPY apps/web/src/hooks apps/web/src/hooks
COPY apps/web/src/store apps/web/src/store
COPY apps/web/src/utils apps/web/src/utils
COPY apps/web/app/(teacher) apps/web/app/(teacher)
COPY apps/web/app/(student) apps/web/app/(student)
COPY apps/web/app/globals.css apps/web/app/
COPY apps/web/app/page.tsx apps/web/app/
COPY apps/web/app/page.module.css apps/web/app/
COPY apps/web/app/favicon.ico apps/web/app/
COPY apps/web/app/fonts apps/web/app/fonts
COPY apps/web/public apps/web/public
COPY apps/web/package.json apps/web/
COPY apps/web/tsconfig.json apps/web/
COPY apps/web/.gitignore apps/web/
COPY apps/web/next.config.js apps/web/
COPY apps/web/webpack.config.js apps/web/
COPY apps/web/tailwind.config.* apps/web/
COPY apps/web/postcss.config.js apps/web/
COPY apps/web/README.md apps/web/

RUN bun run --filter web build

# ─── Runner stage ────────────────────────────────────────────
FROM oven/bun:1.3-alpine AS runner
WORKDIR /app

RUN addgroup -S -g 1001 appgroup && adduser -S -u 1001 -G appgroup appuser

COPY --from=build /app/apps/web/.next         ./.next
COPY --from=build /app/apps/web/public        ./public
COPY --from=build /app/apps/web/package.json  ./
COPY --from=build /app/apps/web/next.config.js ./
COPY --from=build /app/node_modules           ./node_modules

USER appuser
EXPOSE 3000

ENV NODE_ENV=production

CMD ["bun", "run", "start"]
