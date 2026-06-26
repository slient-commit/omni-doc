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

router.get('/:id',
  checkPermission('read', 'document'),
  validate([param('id').isInt()]),
  ctrl.getById,
);

router.get('/:id/download',
  checkPermission('read', 'document'),
  validate([param('id').isInt()]),
  ctrl.download,
);

router.patch('/:id',
  checkPermission('update', 'document'),
  validate([param('id').isInt()]),
  ctrl.update,
);

router.delete('/:id',
  checkPermission('delete', 'document'),
  validate([param('id').isInt()]),
  ctrl.softDelete,
);

router.delete('/:id/permanent',
  checkPermission('delete', 'document'),
  validate([param('id').isInt()]),
  ctrl.hardDelete,
);

router.post('/:id/restore',
  checkPermission('update', 'document'),
  validate([param('id').isInt()]),
  ctrl.restore,
);

router.post('/:id/move',
  checkPermission('update', 'document'),
  validate([param('id').isInt()]),
  ctrl.move,
);

module.exports = router;
