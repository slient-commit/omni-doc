# omni-doc API

Express REST API for omni-doc.

## Requirements

- Node.js >= 14

## Setup

```bash
cd api
npm install                 # also runs `prisma generate` via postinstall
cp ../.env.example ../.env  # then set DATABASE_URL (single .env at repo root)
```

Set `DATABASE_URL` in the root `.env` to your MySQL instance:

```
DATABASE_URL="mysql://user:password@host:3306/omni_doc"
```

## Database (Prisma + MySQL)

The schema lives in [prisma/schema.prisma](prisma/schema.prisma). Migrations
are committed under [prisma/migrations/](prisma/migrations/).

```bash
npm run db:migrate     # create + apply a new migration (development)
npm run db:deploy      # apply pending migrations (production / CI)
npm run db:generate    # regenerate the Prisma client
npm run db:studio      # open Prisma Studio
```

After editing the schema, run `npm run db:migrate` to generate a migration,
then commit the new folder in `prisma/migrations/`.

## Running

```bash
npm run dev        # development with auto-reload (nodemon)
npm start          # production (no migration step)
npm run start:prod # runs `prisma migrate deploy` first, then starts the server
```

The server listens on `PORT` (default `3000`).

## Deployment / auto-migration

Pending migrations are applied automatically on deploy. Either use the
combined script:

```bash
npm run start:prod   # prisma migrate deploy && node src/server.js
```

…or run the migration as a separate release/CI step before starting:

```bash
npm ci --omit=dev
npm run db:deploy
npm start
```

`prisma migrate deploy` is non-interactive and only applies committed
migrations — safe to run on every deploy.

## Endpoints

| Method | Path                  | Description                   |
| ------ | --------------------- | ----------------------------- |
| GET    | `/api`                | API info                      |
| GET    | `/api/health`         | Liveness check                |
| GET    | `/api/health/ready`   | Readiness check (pings DB)    |

## Project structure

```
api/
├── src/
│   ├── config/        # environment-driven config
│   ├── middleware/     # express middleware (error handling, ...)
│   ├── routes/         # route definitions
│   ├── app.js          # express app setup
│   └── server.js       # HTTP server bootstrap
└── package.json
```
