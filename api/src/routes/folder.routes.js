'use strict';

const { Router } = require('express');
const { body, param } = require('express-validator');
const { validate } = require('../middleware/validate');
const { checkPermission } = require('../middleware/checkPermission');
const ctrl = require('../controllers/folder.controller');

const router = Router();

router.post('/',
  checkPermission('create', 'folder'),
  validate([body('name').notEmpty().withMessage('Folder name is required')]),
  ctrl.create,
);

router.get('/', checkPermission('read', 'folder'), ctrl.list);

router.get('/:id',
  checkPermission('read', 'folder'),
  validate([param('id').isInt()]),
  ctrl.getById,
);

router.get('/:id/ancestors',
  checkPermission('read', 'folder'),
  validate([param('id').isInt()]),
  ctrl.getAncestors,
);

router.patch('/:id',
  checkPermission('update', 'folder'),
  validate([param('id').isInt(), body('name').notEmpty().withMessage('Folder name is required')]),
  ctrl.rename,
);

router.delete('/:id',
  checkPermission('delete', 'folder'),
  validate([param('id').isInt()]),
  ctrl.softDelete,
);

router.delete('/:id/permanent',
  checkPermission('delete', 'folder'),
  validate([param('id').isInt()]),
  ctrl.hardDelete,
);

router.post('/:id/restore',
  checkPermission('update', 'folder'),
  validate([param('id').isInt()]),
  ctrl.restore,
);

module.exports = router;
