'use strict';

const path = require('path');
require('dotenv').config();

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,
  corsOrigin: process.env.CORS_ORIGIN || '*',
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  resendApiKey: process.env.RESEND_API_KEY,
  emailFrom: process.env.EMAIL_FROM || 'onboarding@resend.dev',
  appUrl: process.env.APP_URL || 'http://localhost:5173',
  storagePath: process.env.STORAGE_PATH || path.join(__dirname, '../../uploads'),
  trashRetentionDays: parseInt(process.env.TRASH_RETENTION_DAYS, 10) || 30,
  orgRetentionDays: parseInt(process.env.ORG_RETENTION_DAYS, 10) || 30,
  zipExpiryHours: parseInt(process.env.ZIP_EXPIRY_HOURS, 10) || 24,
};

module.exports = config;
