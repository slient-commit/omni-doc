#!/bin/sh
set -e

# Apply any pending Prisma migrations against the external database.
# Non-fatal: if the DB is briefly unreachable at boot we still start the
# processes (the /api/health/ready endpoint will report DB status).
echo "[entrypoint] Running prisma migrate deploy..."
if (cd /srv/api && npx prisma migrate deploy); then
  echo "[entrypoint] Migrations applied."
else
  echo "[entrypoint] WARNING: prisma migrate deploy failed; starting anyway."
fi

echo "[entrypoint] Starting supervisord (omni-doc-app + omni-doc-api)..."
exec supervisord -c /etc/supervisor/conf.d/supervisord.conf
