'use strict';

const { Router } = require('express');
const { param, body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { checkPermission } = require('../middleware/checkPermission');
const ctrl = require('../controllers/role.controller');

const router = Router();

router.get('/', checkPermission('read', 'role'), ctrl.list);

router.get('/permissions', checkPermission('read', 'role'), ctrl.listPermissions);

// ponytail: returns current user's role permissions — no permission check needed (own data)
router.get('/my-permissions', ctrl.myPermissions);

router.post('/',
  checkPermission('create', 'role'),
  validate([body('name').notEmpty().withMessage('Role name is required')]),
  ctrl.create,
);

router.patch('/:id',
  checkPermission('update', 'role'),
  validate([param('id').isInt()]),
  ctrl.update,
);

router.delete('/:id',
  checkPermission('delete', 'role'),
  validate([param('id').isInt()]),
  ctrl.remove,
);

module.exports = router;
