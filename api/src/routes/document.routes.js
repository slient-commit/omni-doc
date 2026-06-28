'use strict';

const { Router } = require('express');
const { param } = require('express-validator');
const { validate } = require('../middleware/validate');
const { checkPermission } = require('../middleware/checkPermission');
const uploadMiddleware = require('../lib/upload');
const ctrl = require('../controllers/document.controller');

const router = Router();

router.post('/',
  checkPermission('create', 'document'),
  uploadMiddleware.single('file'),
  ctrl.upload,
);

router.get('/', checkPermission('read', 'document'), ctrl.list);

router.post('/upload-zip',
  checkPermission('create', 'document'),
  checkPermission('create', 'folder'),
  uploadMiddleware.single('file'),
  ctrl.uploadZip,
);

router.get('/:id',
  checkPermission('read', 'document'),
  validate([param('id').notEmpty()]),
  ctrl.getById,
);

router.get('/:id/download',
  checkPermission('read', 'document'),
  validate([param('id').notEmpty()]),
  ctrl.download,
);

router.patch('/:id',
  checkPermission('update', 'document'),
  validate([param('id').notEmpty()]),
  ctrl.update,
);

router.delete('/:id',
  checkPermission('delete', 'document'),
  validate([param('id').notEmpty()]),
  ctrl.softDelete,
);

router.delete('/:id/permanent',
  checkPermission('delete', 'document'),
  validate([param('id').notEmpty()]),
  ctrl.hardDelete,
);

router.post('/:id/restore',
  checkPermission('update', 'document'),
  validate([param('id').notEmpty()]),
  ctrl.restore,
);

router.post('/:id/move',
  checkPermission('update', 'document'),
  validate([param('id').notEmpty()]),
  ctrl.move,
);

router.post('/:id/copy',
  checkPermission('update', 'document'),
  validate([param('id').notEmpty()]),
  ctrl.copyToFolder,
);

// ponytail: pre-signed URL for MS Office online viewer
router.post('/:id/presign',
  checkPermission('read', 'document'),
  validate([param('id').notEmpty()]),
  ctrl.createPresign,
);

router.delete('/:id/presign/:token',
  ctrl.revokePresign,
);

module.exports = router;
