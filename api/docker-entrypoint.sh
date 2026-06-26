#!/bin/sh
set -e

# Apply any pending Prisma migrations against the external database.
# Non-fatal: if the DB is briefly unreachable at boot we still start the API
# (the /api/health/ready endpoint reports DB status).
echo "[entrypoint] Running prisma migrate deploy..."
if npx prisma migrate deploy; then
  echo "[entrypoint] Migrations applied."
  echo "[entrypoint] Running seed..."
  if node prisma/seed.js; then
    echo "[entrypoint] Seed complete."
  else
    echo "[entrypoint] WARNING: seed failed; starting anyway."
  fi
else
  echo "[entrypoint] WARNING: prisma migrate deploy failed; starting anyway."
fi

echo "[entrypoint] Starting API..."
exec node src/server.js
