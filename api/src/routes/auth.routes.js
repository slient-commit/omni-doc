'use strict';

const { Router } = require('express');
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { validate } = require('../middleware/validate');
const ctrl = require('../controllers/auth.controller');

// ponytail: strict rate limits on auth endpoints
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: { error: { message: 'Too many attempts, try again later' } } });
const registerLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 5, message: { error: { message: 'Too many registrations, try again later' } } });

const router = Router();

router.post(
  '/register',
  registerLimiter,
  validate([
    body('email').isEmail().withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 10 }).withMessage('Password must be at least 10 characters')
      .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter')
      .matches(/[a-z]/).withMessage('Password must contain a lowercase letter')
      .matches(/\d/).withMessage('Password must contain a number'),
    body('firstName').notEmpty().withMessage('First name is required'),
    body('lastName').notEmpty().withMessage('Last name is required'),
    body('organizationName').notEmpty().withMessage('Organization name is required'),
  ]),
  ctrl.register,
);

router.post(
  '/login',
  authLimiter,
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
  authLimiter,
  validate([body('email').isEmail().withMessage('Valid email is required')]),
  ctrl.forgotPassword,
);

router.post(
  '/reset-password',
  authLimiter,
  validate([
    body('token').notEmpty().withMessage('Token is required'),
    body('newPassword')
      .isLength({ min: 10 }).withMessage('Password must be at least 10 characters')
      .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter')
      .matches(/[a-z]/).withMessage('Password must contain a lowercase letter')
      .matches(/\d/).withMessage('Password must contain a number'),
  ]),
  ctrl.resetPassword,
);

module.exports = router;
