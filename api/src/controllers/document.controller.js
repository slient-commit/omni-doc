'use strict';

const documentService = require('../services/document.service');

async function upload(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: { message: 'File is required' } });
    }
    const doc = await documentService.upload({
      file: req.file,
      documentDate: req.body.documentDate || new Date().toISOString(),
      categoryId: req.body.categoryId,
      folderId: req.body.folderId,
      organizationId: req.user.organizationId,
      createdById: req.user.id,
      isPrivate: req.body.isPrivate,
      allowEdit: req.body.allowEdit,
      allowDelete: req.body.allowDelete,
      allowMove: req.body.allowMove,
      allowCopy: req.body.allowCopy,
      metadata: req.body.metadata,
    });
    res.status(201).json(doc);
  } catch (err) { next(err); }
}

async function list(req, res, next) {
  try {
    const docs = await documentService.list({
      organizationId: req.user.organizationId,
      userId: req.user.id,
      folderId: req.query.folderId,
      categoryId: req.query.categoryId,
      search: req.query.search,
      createdById: req.query.createdById,
      sharedWithMe: req.query.sharedWithMe === 'true',
    });
    res.json(docs);
  } catch (err) { next(err); }
}

async function getById(req, res, next) {
  try {
    const doc = await documentService.getById({
      id: req.params.id,
      userId: req.user.id,
      organizationId: req.user.organizationId,
    });
    res.json(doc);
  } catch (err) { next(err); }
}

async function download(req, res, next) {
  try {
    const { absolutePath, originalName } = await documentService.getDownloadInfo({
      id: req.params.id,
      userId: req.user.id,
      organizationId: req.user.organizationId,
    });
    if (req.query.preview === 'true') {
      // ponytail: inline display for preview — browser renders instead of downloading
      const mimeType = require('path').extname(originalName);
      const mimeMap = { '.pdf': 'application/pdf', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp', '.txt': 'text/plain', '.mp4': 'video/mp4', '.webm': 'video/webm', '.mp3': 'audio/mpeg', '.wav': 'audio/wav' };
      res.setHeader('Content-Type', mimeMap[mimeType.toLowerCase()] || 'application/octet-stream');
      res.setHeader('Content-Disposition', `inline; filename="${originalName}"`);
      require('fs').createReadStream(absolutePath).pipe(res);
    } else {
      res.download(absolutePath, originalName);
    }
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const doc = await documentService.update({
      id: req.params.id,
      ...req.body,
      organizationId: req.user.organizationId,
      userId: req.user.id,
    });
    res.json(doc);
  } catch (err) { next(err); }
}

async function softDelete(req, res, next) {
  try {
    const result = await documentService.softDelete({
      id: req.params.id,
      organizationId: req.user.organizationId,
      userId: req.user.id,
    });
    res.json(result);
  } catch (err) { next(err); }
}

async function hardDelete(req, res, next) {
  try {
    const result = await documentService.hardDelete({
      id: req.params.id,
      organizationId: req.user.organizationId,
      userId: req.user.id,
    });
    res.json(result);
  } catch (err) { next(err); }
}

async function restore(req, res, next) {
  try {
    const result = await documentService.restore({
      id: req.params.id,
      organizationId: req.user.organizationId,
      userId: req.user.id,
    });
    res.json(result);
  } catch (err) { next(err); }
}

async function move(req, res, next) {
  try {
    const result = await documentService.move({
      id: req.params.id,
      folderIds: req.body.folderIds,
      organizationId: req.user.organizationId,
      userId: req.user.id,
    });
    res.json(result);
  } catch (err) { next(err); }
}

async function copyToFolder(req, res, next) {
  try {
    const result = await documentService.copyToFolder({
      id: req.params.id,
      targetFolderId: req.body.targetFolderId || null,
      organizationId: req.user.organizationId,
      userId: req.user.id,
    });
    res.status(201).json(result);
  } catch (err) { next(err); }
}

async function uploadZip(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ error: { message: 'ZIP file is required' } });
    const { extractZip } = require('../services/zip-upload.service');
    const result = await extractZip({
      zipPath: req.file.path,
      parentFolderId: req.body.folderId || null,
      organizationId: req.user.organizationId,
      createdById: req.user.id,
      isPrivate: req.body.isPrivate,
      allowEdit: req.body.allowEdit,
      allowDelete: req.body.allowDelete,
      allowMove: req.body.allowMove,
      allowCopy: req.body.allowCopy,
    });
    res.status(201).json(result);
  } catch (err) { next(err); }
}

// ponytail: create a pre-signed public URL for MS Office viewer
async function createPresign(req, res, next) {
  try {
    const presign = require('../lib/presign');
    const config = require('../config');

    const doc = await documentService.getById({
      id: req.params.id,
      userId: req.user.id,
      organizationId: req.user.organizationId,
    });

    const token = presign.create(doc.id);
    const publicUrl = `${config.appUrl}/api/public/doc/${token}`;

    res.json({ token, url: publicUrl });
  } catch (err) { next(err); }
}

async function revokePresign(req, res, next) {
  try {
    const presign = require('../lib/presign');
    presign.revoke(req.params.token);
    res.json({ message: 'Revoked' });
  } catch (err) { next(err); }
}

// Public — no auth, serves file via presign token
async function publicDocDownload(req, res, next) {
  try {
    const presign = require('../lib/presign');
    const documentId = presign.verify(req.params.token);
    if (!documentId) {
      return res.status(404).json({ error: { message: 'Link expired or invalid' } });
    }

    const prisma = require('../lib/prisma');
    const { resolveFilePath } = require('../lib/filePath');

    const doc = await prisma.document.findUnique({
      where: { id: documentId },
      include: { organization: { select: { storagePath: true } } },
    });
    if (!doc) {
      return res.status(404).json({ error: { message: 'Document not found' } });
    }

    const absolutePath = resolveFilePath(doc.organization.storagePath, doc.filePath);
    res.download(absolutePath, doc.originalName);
  } catch (err) { next(err); }
}

module.exports = { upload, list, getById, download, update, softDelete, hardDelete, restore, move, copyToFolder, uploadZip, createPresign, revokePresign, publicDocDownload };
