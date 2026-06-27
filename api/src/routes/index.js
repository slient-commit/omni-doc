'use strict';

const express = require('express');
const config = require('../config');
const { authenticate } = require('../middleware/auth');

const healthRoutes = require('./health.routes');
const authRoutes = require('./auth.routes');
const documentRoutes = require('./document.routes');
const folderRoutes = require('./folder.routes');
const trashRoutes = require('./trash.routes');
const { documentInviteRoutes, folderInviteRoutes, shareLinkRoutes, publicShareRoutes } = require('./sharing.routes');
const userRoutes = require('./user.routes');
const roleRoutes = require('./role.routes');
const organizationRoutes = require('./organization.routes');

const router = express.Router();

// Public routes
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/shared', publicShareRoutes);

router.get('/', (req, res) => {
  res.json({ message: 'Omni Doc API', version: '1.0.0', trashRetentionDays: config.trashRetentionDays });
});

// Authenticated routes
router.use('/documents', authenticate, documentRoutes);
router.use('/documents', authenticate, documentInviteRoutes);
router.use('/folders', authenticate, folderRoutes);
router.use('/folders', authenticate, folderInviteRoutes);
router.use('/trash', authenticate, trashRoutes);
router.use('/share-links', authenticate, shareLinkRoutes);
router.use('/users', authenticate, userRoutes);
router.use('/roles', authenticate, roleRoutes);
router.use('/organization', authenticate, organizationRoutes);

module.exports = router;
