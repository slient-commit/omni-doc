# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# Stage 1 — install dependencies and generate the Prisma client
# ---------------------------------------------------------------------------
FROM node:20-bookworm-slim AS build
WORKDIR /app

# OpenSSL is required by Prisma's query engine (and for correct libssl
# detection when generating the client).
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

# A placeholder is enough for `prisma generate` (it never connects here);
# the real connection string is injected at runtime.
ENV DATABASE_URL="mysql://placeholder:placeholder@localhost:3306/placeholder"

COPY package.json package-lock.json ./
COPY prisma ./prisma
# Full install (incl. the prisma CLI) — needed for `prisma generate` here and
# for `prisma migrate deploy` at container start.
RUN npm ci

# ---------------------------------------------------------------------------
# Stage 2 — runtime
# ---------------------------------------------------------------------------
FROM node:20-bookworm-slim AS runtime
WORKDIR /app

# OpenSSL is required at runtime by Prisma's query engine.
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV PORT=3000
ENV TZ=UTC

COPY --from=build /app/node_modules ./node_modules
COPY . .
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
