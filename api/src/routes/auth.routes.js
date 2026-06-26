'use strict';

const { Router } = require('express');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const ctrl = require('../controllers/auth.controller');

const router = Router();

router.post(
  '/register',
  validate([
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('firstName').notEmpty().withMessage('First name is required'),
    body('lastName').notEmpty().withMessage('Last name is required'),
    body('organizationName').notEmpty().withMessage('Organization name is required'),
  ]),
  ctrl.register,
);

router.post(
  '/login',
  validate([
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ]),
  ctrl.login,
);

router.post(
  '/verify-email',
  validate([body('token').notEmpty().withMessage('Token is required')]),
  ctrl.verifyEmail,
);

router.post(
  '/forgot-password',
  validate([body('email').isEmail().withMessage('Valid email is required')]),
  ctrl.forgotPassword,
);

router.post(
  '/reset-password',
  validate([
    body('token').notEmpty().withMessage('Token is required'),
    body('newPassword').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  ]),
  ctrl.resetPassword,
);

module.exports = router;
