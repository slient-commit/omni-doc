'use strict';

const express = require('express');

const healthRoutes = require('./health.routes');

const router = express.Router();

router.use('/health', healthRoutes);

router.get('/', (req, res) => {
  res.json({ message: 'omni-doc API', version: '1.0.0' });
});

module.exports = router;
