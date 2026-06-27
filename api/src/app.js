'use strict';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');

const config = require('./config');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

// ponytail: Prisma returns BigInt for fileSize; Express JSON.stringify chokes on it
BigInt.prototype.toJSON = function () { return Number(this); };

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow iframe/img loads
  contentSecurityPolicy: false, // ponytail: CSP breaks inline styles from Tailwind, enable later with nonces
}));

// CORS — restrictive in production
app.use(cors({
  origin: config.corsOrigin === '*' ? true : config.corsOrigin.split(',').map((s) => s.trim()),
  credentials: true,
}));

// Global rate limit — 200 req/min per IP
app.use(rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: 'Too many requests, slow down' } },
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.set('trust proxy', 1); // trust first proxy (Traefik/nginx)

if (config.env !== 'test') {
  app.use(morgan(config.env === 'development' ? 'dev' : 'combined'));
}

// Routes
app.use('/api', routes);

// Error handling (must be registered last)
app.use(notFound);
app.use(errorHandler);

module.exports = app;
