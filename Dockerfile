# ============================================================
# Stage 1 — install dependencies
# ============================================================
FROM node:20-alpine AS deps

RUN apk add --no-cache libc6-compat

WORKDIR /app

# Full source copy — .dockerignore strips node_modules, dist,
# .turbo, .cache, .yarn/cache, test files, and build artifacts
# so the context is already lean (~20 MB).
COPY . .

RUN yarn install --immutable

# ============================================================
# Stage 2 — build
# ============================================================
FROM deps AS build

RUN yarn build

# ============================================================
# Stage 3 — production runner
# ============================================================
FROM node:20-alpine AS runner

RUN apk add --no-cache libc6-compat wget

WORKDIR /app

ENV NODE_ENV=production

COPY --from=build /app ./

EXPOSE 9000

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD wget -qO- http://localhost:9000/health || exit 1

CMD ["node", "docker-entrypoint.js"]
