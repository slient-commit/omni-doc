'use strict';

const { Router } = require('express');
const { checkPermission } = require('../middleware/checkPermission');
const ctrl = require('../controllers/trash.controller');

const router = Router();

router.get('/',
  checkPermission('delete', 'document'),
  checkPermission('delete', 'folder'),
  ctrl.list,
);

router.delete('/empty',
  checkPermission('delete', 'document'),
  checkPermission('delete', 'folder'),
  ctrl.emptyAll,
);

module.exports = router;
