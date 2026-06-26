'use strict';

const crypto = require('crypto');

function generateToken(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

function generateTokenExpiry(hours = 24) {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

module.exports = { generateToken, generateTokenExpiry };
