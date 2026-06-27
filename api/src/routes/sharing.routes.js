'use strict';

const { Router } = require('express');
const { param, body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { checkPermission } = require('../middleware/checkPermission');
const ctrl = require('../controllers/sharing.controller');

// Document invite routes (mounted under /documents)
const documentInviteRoutes = Router({ mergeParams: true });

documentInviteRoutes.post('/:id/invite',
  checkPermission('update', 'document'),
  validate([
    param('id').notEmpty(),
    body('invitedUserId').isInt(),
    body('permission').isIn(['view', 'edit']),
  ]),
  ctrl.createDocumentInvite,
);

documentInviteRoutes.delete('/:id/invite/:inviteId',
  checkPermission('update', 'document'),
  validate([param('id').notEmpty(), param('inviteId').isInt()]),
  ctrl.deleteDocumentInvite,
);

// Folder invite routes (mounted under /folders)
const folderInviteRoutes = Router({ mergeParams: true });

folderInviteRoutes.post('/:id/invite',
  checkPermission('update', 'folder'),
  validate([
    param('id').notEmpty(),
    body('invitedUserId').isInt(),
    body('permission').isIn(['view', 'edit']),
  ]),
  ctrl.createFolderInvite,
);

folderInviteRoutes.delete('/:id/invite/:inviteId',
  checkPermission('update', 'folder'),
  validate([param('id').notEmpty(), param('inviteId').isInt()]),
  ctrl.deleteFolderInvite,
);

// Share link routes (mounted under /share-links)
const shareLinkRoutes = Router();

shareLinkRoutes.post('/',
  checkPermission('update', 'document'),
  ctrl.createShareLink,
);

shareLinkRoutes.get('/',
  checkPermission('read', 'document'),
  ctrl.listShareLinks,
);

shareLinkRoutes.delete('/:id',
  checkPermission('update', 'document'),
  validate([param('id').notEmpty()]),
  ctrl.deleteShareLink,
);

// Public share access route (mounted under /shared, no auth)
const publicShareRoutes = Router();

publicShareRoutes.get('/:token', ctrl.accessShareLink);
publicShareRoutes.get('/:token/download', ctrl.downloadSharedFile);

module.exports = { documentInviteRoutes, folderInviteRoutes, shareLinkRoutes, publicShareRoutes };
