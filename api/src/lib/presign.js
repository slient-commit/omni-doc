'use strict';

const crypto = require('crypto');

// ponytail: in-memory presign store — upgrade to Redis if running multiple instances
const tokens = new Map(); // token -> { documentId, expiresAt }

const TTL_MS = 10 * 60 * 1000; // 10 minutes

function create(documentId) {
  const token = crypto.randomBytes(32).toString('hex');
  tokens.set(token, { documentId, expiresAt: Date.now() + TTL_MS });
  return token;
}

function verify(token) {
  const entry = tokens.get(token);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    tokens.delete(token);
    return null;
  }
  return entry.documentId;
}

function revoke(token) {
  tokens.delete(token);
}

// Cleanup expired tokens every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [token, entry] of tokens) {
    if (now > entry.expiresAt) tokens.delete(token);
  }
}, 5 * 60 * 1000);

module.exports = { create, verify, revoke };
