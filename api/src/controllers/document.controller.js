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

async function getEditorConfig(req, res, next) {
  try {
    const config = require('../config');
    const jwt = require('jsonwebtoken');

    if (!config.onlyofficeUrl || !config.onlyofficeJwtSecret) {
      return res.status(501).json({ error: { message: 'ONLYOFFICE is not configured' } });
    }

    const doc = await documentService.getById({
      id: req.params.id,
      userId: req.user.id,
      organizationId: req.user.organizationId,
    });

    const ext = doc.originalName.split('.').pop()?.toLowerCase() || '';
    const typeMap = {
      docx: 'word', doc: 'word', odt: 'word', rtf: 'word', txt: 'word',
      xlsx: 'cell', xls: 'cell', ods: 'cell', csv: 'cell',
      pptx: 'slide', ppt: 'slide', odp: 'slide',
    };
    const documentType = typeMap[ext];
    if (!documentType) {
      return res.status(400).json({ error: { message: 'File type not supported by ONLYOFFICE' } });
    }

    // ponytail: short-lived token scoped to this document — don't leak user's session JWT
    const fileToken = jwt.sign(
      { userId: req.user.id, organizationId: req.user.organizationId },
      config.jwtSecret,
      { expiresIn: '10m' },
    );

    // ponytail: ONLYOFFICE fetches from the public app URL (must be reachable from the container)
    const downloadUrl = `${config.appUrl}/api/documents/${doc.uuid}/download?token=${fileToken}`;

    const editorConfig = {
      document: {
        fileType: ext,
        key: `${doc.uuid}-${new Date(doc.updatedAt).getTime()}`,
        title: doc.originalName,
        url: downloadUrl,
        permissions: { edit: false, download: true, print: true },
      },
      documentType,
      editorConfig: {
        mode: 'view',
        lang: 'en',
        customization: {
          forcesave: false,
          compactHeader: true,
          toolbarNoTabs: true,
        },
      },
    };

    const onlyofficeToken = jwt.sign(editorConfig, config.onlyofficeJwtSecret);
    editorConfig.token = onlyofficeToken;

    res.json({
      onlyofficeUrl: config.onlyofficeUrl,
      config: editorConfig,
    });
  } catch (err) { next(err); }
}

module.exports = { upload, list, getById, download, update, softDelete, hardDelete, restore, move, copyToFolder, uploadZip, getEditorConfig };
