# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# Stage 1 — build the React (Vite) frontend into static files
# ---------------------------------------------------------------------------
FROM node:20-bookworm-slim AS app-build
WORKDIR /build/app

COPY app/package.json app/package-lock.json ./
RUN npm ci

COPY app/ ./
RUN npm run build

# ---------------------------------------------------------------------------
# Stage 2 — install API dependencies and generate the Prisma client
# ---------------------------------------------------------------------------
FROM node:20-bookworm-slim AS api-build
WORKDIR /build/api

# A placeholder is enough for `prisma generate` (it never connects here);
# the real connection string is injected at runtime.
ENV DATABASE_URL="mysql://placeholder:placeholder@localhost:3306/placeholder"

COPY api/package.json api/package-lock.json ./
COPY api/prisma ./prisma
# Full install (incl. the prisma CLI) — needed both for `prisma generate`
# during build and for `prisma migrate deploy` at container start.
RUN npm ci

# ---------------------------------------------------------------------------
# Stage 3 — runtime: nginx (static app) + node (api) under supervisord
# ---------------------------------------------------------------------------
FROM node:20-bookworm-slim AS runtime

RUN apt-get update \
    && apt-get install -y --no-install-recommends nginx supervisor \
    && rm -rf /var/lib/apt/lists/* \
    && rm -f /etc/nginx/sites-enabled/default

# --- API ---
WORKDIR /srv/api
COPY api/ ./
COPY --from=api-build /build/api/node_modules ./node_modules

# --- Static frontend (served by nginx) ---
COPY --from=app-build /build/app/dist /usr/share/nginx/html

# --- Process & web-server config ---
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

ENV NODE_ENV=production
ENV PORT=3000

# nginx serves the app (and proxies /api -> 127.0.0.1:3000) on port 80
EXPOSE 80

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
