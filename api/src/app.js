'use strict';

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const config = require('./config');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

// ponytail: Prisma returns BigInt for fileSize; Express JSON.stringify chokes on it
BigInt.prototype.toJSON = function () { return Number(this); };

// Core middleware
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (config.env !== 'test') {
  app.use(morgan(config.env === 'development' ? 'dev' : 'combined'));
}

// Routes
app.use('/api', routes);

// Error handling (must be registered last)
app.use(notFound);
app.use(errorHandler);

module.exports = app;
