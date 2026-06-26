# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# Stage 1 — build the React (Vite) app into static files
# ---------------------------------------------------------------------------
FROM node:20-bookworm-slim AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---------------------------------------------------------------------------
# Stage 2 — serve the static build with nginx (proxies /api -> omni-doc-api)
# ---------------------------------------------------------------------------
FROM nginx:1.27-alpine AS runtime

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
