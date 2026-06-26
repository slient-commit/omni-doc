'use strict';

const { Router } = require('express');
const { param, body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { checkPermission } = require('../middleware/checkPermission');
const ctrl = require('../controllers/user.controller');

const router = Router();

router.get('/', checkPermission('read', 'user'), ctrl.list);

router.post('/invite',
  checkPermission('create', 'user'),
  validate([
    body('email').isEmail(),
    body('firstName').notEmpty(),
    body('lastName').notEmpty(),
  ]),
  ctrl.invite,
);

router.patch('/:id',
  checkPermission('update', 'user'),
  validate([param('id').isInt()]),
  ctrl.update,
);

router.delete('/:id',
  checkPermission('delete', 'user'),
  validate([param('id').isInt()]),
  ctrl.deactivate,
);

module.exports = router;
