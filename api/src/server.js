'use strict';

const app = require('./app');
const config = require('./config');
const prisma = require('./lib/prisma');

const server = app.listen(config.port, () => {
  console.log(`omni-doc API listening on port ${config.port} [${config.env}]`);
});

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
