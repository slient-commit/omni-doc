# omni-doc

Monorepo with two parts:

- [api/](api/) — Express REST API (Prisma + MySQL)
- [app/](app/) — React 19 + Vite frontend (shadcn/ui)

## Docker (two containers)

Two services: **`omni-doc-api`** (Express) and **`omni-doc-app`** (nginx serving
the React build and proxying `/api` to the API). MySQL is **external** — supply
a connection string via `DATABASE_URL`.

### Run

```bash
cp .env.example .env        # set DATABASE_URL to your external MySQL
docker compose up --build
```

The app is served at http://localhost:8080 (API under http://localhost:8080/api).

- On startup, `omni-doc-api` runs `prisma migrate deploy` to apply migrations.
- `DATABASE_URL` must point at a reachable MySQL. To reach a MySQL on your
  host machine from the container, use `host.docker.internal`:
  `mysql://user:password@host.docker.internal:3306/omni_doc`

### Layout

```
docker-compose.yml         # services: omni-doc-api, omni-doc-app
api/
├── Dockerfile             # node runtime (multi-stage, generates Prisma client)
└── docker-entrypoint.sh   # migrate deploy, then start the API
app/
├── Dockerfile             # build React -> serve via nginx
└── nginx.conf             # serves app, proxies /api -> omni-doc-api:3000
```

See [api/README.md](api/README.md) and [app/README.md](app/README.md) for
running each part locally without Docker.
