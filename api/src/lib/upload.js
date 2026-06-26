'use strict';

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const config = require('../config');

const storage = multer.diskStorage({
  destination(req, _file, cb) {
    const orgPath = path.join(config.storagePath, req.user.organization.storagePath);
    fs.mkdirSync(orgPath, { recursive: true });
    cb(null, orgPath);
  },
  filename(_req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
});

module.exports = upload;
