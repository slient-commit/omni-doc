'use strict';

const path = require('path');
const config = require('../config');

// ponytail: single path resolver with traversal guard, replaces duplicate in document.service + missing in trash.service
function resolveFilePath(orgStoragePath, filePath) {
  const orgDir = path.resolve(config.storagePath, orgStoragePath);
  const resolved = path.resolve(orgDir, filePath);
  if (!resolved.startsWith(orgDir)) {
    const err = new Error('Invalid file path');
    err.status = 400;
    throw err;
  }
  return resolved;
}

module.exports = { resolveFilePath };
