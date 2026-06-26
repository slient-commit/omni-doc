'use strict';

const { PrismaClient } = require('@prisma/client');

const config = require('../config');

// Single shared PrismaClient instance. Reusing one client avoids exhausting
// the database connection pool (especially under nodemon reloads in dev).
const globalForPrisma = global;

const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: config.env === 'development' ? ['query', 'warn', 'error'] : ['warn', 'error'],
  });

if (config.env !== 'production') {
  globalForPrisma.prisma = prisma;
}

module.exports = prisma;
