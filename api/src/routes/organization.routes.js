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

router.delete('/',
  validate([body('confirmEmail').isEmail().withMessage('Email confirmation required')]),
  ctrl.softDelete,
);

router.post('/recover',
  validate([body('confirmEmail').isEmail().withMessage('Email confirmation required')]),
  ctrl.recover,
);

router.post('/export', checkPermission('manage', 'organization'), ctrl.requestExport);
router.get('/exports', checkPermission('manage', 'organization'), ctrl.listExports);
router.get('/exports/:id/download', ctrl.downloadExport);

module.exports = router;
