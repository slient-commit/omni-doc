'use strict';

const app = require('./app');
const config = require('./config');
const prisma = require('./lib/prisma');
const { cleanupTrash } = require('./cron/trash-cleanup');

const server = app.listen(config.port, () => {
  console.log(`omni-doc API listening on port ${config.port} [${config.env}]`);
  console.log(`[trash-cleanup] Retention: ${config.trashRetentionDays} days`);
});

// ponytail: setInterval cron — runs at UTC midnight, no npm dep needed
function scheduleAtMidnightUTC() {
  const now = new Date();
  const nextMidnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  const msUntil = nextMidnight.getTime() - now.getTime();

  setTimeout(() => {
    cleanupTrash().catch((err) => console.error('[trash-cleanup] Error:', err.message));
    // Then run every 24h
    setInterval(() => {
      cleanupTrash().catch((err) => console.error('[trash-cleanup] Error:', err.message));
    }, 24 * 60 * 60 * 1000);
  }, msUntil);

  console.log(`[trash-cleanup] Next run in ${Math.round(msUntil / 60000)} minutes`);
}

scheduleAtMidnightUTC();

// Graceful shutdown
function shutdown(signal) {
  console.log(`\n${signal} received, shutting down...`);
  server.close(async () => {
    await prisma.$disconnect();
    console.log('Server closed.');
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

module.exports = server;
