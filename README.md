# omni-doc

Monorepo with two parts:

- [api/](api/) — Express REST API (Prisma + MySQL)
- [app/](app/) — React 19 + Vite frontend (shadcn/ui)

## Docker (single container)

Both run in **one container**: nginx serves the built React app and proxies
`/api` to the Express server. The two processes are managed by supervisord and
named `omni-doc-app` (nginx) and `omni-doc-api` (node). MySQL is **external** —
supply a connection string via `DATABASE_URL`.

### Run

```bash
cp .env.example .env        # set DATABASE_URL to your external MySQL
docker compose up --build
```

The app is served at http://localhost:8080 (API under http://localhost:8080/api).

- On container start, `prisma migrate deploy` applies pending migrations.
- `DATABASE_URL` must point at a reachable MySQL. To reach a MySQL on your
  host machine from the container, use `host.docker.internal`:
  `mysql://user:password@host.docker.internal:3306/omni_doc`

### Layout

```
Dockerfile            # multi-stage: build app, build api, runtime
docker-compose.yml    # service "omni-doc" (image/container: omni-doc)
docker/
├── nginx.conf        # serves app, proxies /api -> 127.0.0.1:3000
├── supervisord.conf  # runs omni-doc-app + omni-doc-api
└── entrypoint.sh     # migrate deploy, then start supervisord
```

See [api/README.md](api/README.md) and [app/README.md](app/README.md) for
running each part locally without Docker.
