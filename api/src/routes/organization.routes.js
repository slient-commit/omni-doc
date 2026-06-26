'use strict';

const { Router } = require('express');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { checkPermission } = require('../middleware/checkPermission');
const ctrl = require('../controllers/organization.controller');

const router = Router();

router.get('/', ctrl.get);

router.patch('/',
  checkPermission('manage', 'organization'),
  validate([body('name').notEmpty().withMessage('Organization name is required')]),
  ctrl.update,
);

module.exports = router;
