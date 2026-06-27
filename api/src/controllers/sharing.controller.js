'use strict';

const fs = require('fs');
const path = require('path');
const config = require('../config');
const prisma = require('../lib/prisma');
const sharingService = require('../services/sharing.service');

async function createDocumentInvite(req, res, next) {
  try {
    const invite = await sharingService.createDocumentInvite({
      documentId: req.params.id,
      invitedUserId: req.body.invitedUserId,
      permission: req.body.permission,
      invitedById: req.user.id,
      organizationId: req.user.organizationId,
    });
    res.status(201).json(invite);
  } catch (err) { next(err); }
}

async function deleteDocumentInvite(req, res, next) {
  try {
    const result = await sharingService.deleteDocumentInvite({
      inviteId: parseInt(req.params.inviteId, 10),
      organizationId: req.user.organizationId,
    });
    res.json(result);
  } catch (err) { next(err); }
}

async function createFolderInvite(req, res, next) {
  try {
    const invite = await sharingService.createFolderInvite({
      folderId: req.params.id,
      invitedUserId: req.body.invitedUserId,
      permission: req.body.permission,
      invitedById: req.user.id,
      organizationId: req.user.organizationId,
    });
    res.status(201).json(invite);
  } catch (err) { next(err); }
}

async function deleteFolderInvite(req, res, next) {
  try {
    const result = await sharingService.deleteFolderInvite({
      inviteId: parseInt(req.params.inviteId, 10),
      organizationId: req.user.organizationId,
    });
    res.json(result);
  } catch (err) { next(err); }
}

async function createShareLink(req, res, next) {
  try {
    const link = await sharingService.createShareLink({
      documentId: req.body.documentId,
      folderId: req.body.folderId,
      password: req.body.password,
      expiresAt: req.body.expiresAt,
      createdById: req.user.id,
      organizationId: req.user.organizationId,
    });
    res.status(201).json(link);
  } catch (err) { next(err); }
}

async function listShareLinks(req, res, next) {
  try {
    const links = await sharingService.listShareLinks({ createdById: req.user.id });
    res.json(links);
  } catch (err) { next(err); }
}

async function deleteShareLink(req, res, next) {
  try {
    const result = await sharingService.deleteShareLink({
      id: parseInt(req.params.id, 10),
      createdById: req.user.id,
    });
    res.json(result);
  } catch (err) { next(err); }
}

async function accessShareLink(req, res, next) {
  try {
    const result = await sharingService.accessShareLink({
      token: req.params.token,
      password: req.query.password || req.body.password,
    });
    res.json(result);
  } catch (err) { next(err); }
}

// ponytail: download file via share link token — no auth needed
async function downloadSharedFile(req, res, next) {
  try {
    const result = await sharingService.accessShareLink({
      token: req.params.token,
      password: req.query.password,
    });

    if (result.passwordRequired) {
      return res.status(401).json({ error: { message: 'Password required' } });
    }

    if (!result.document) {
      return res.status(400).json({ error: { message: 'This link points to a folder, not a file' } });
    }

    const doc = await prisma.document.findUnique({
      where: { id: result.document.id },
      include: { organization: { select: { storagePath: true } } },
    });

    if (!doc) {
      return res.status(404).json({ error: { message: 'Document not found' } });
    }

    const absolutePath = path.join(config.storagePath, doc.organization.storagePath, doc.filePath);

    if (req.query.preview === 'true') {
      const mimeMap = { '.pdf': 'application/pdf', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp', '.txt': 'text/plain', '.mp4': 'video/mp4', '.mp3': 'audio/mpeg' };
      const ext = path.extname(doc.originalName).toLowerCase();
      res.setHeader('Content-Type', mimeMap[ext] || 'application/octet-stream');
      res.setHeader('Content-Disposition', `inline; filename="${doc.originalName}"`);
      fs.createReadStream(absolutePath).pipe(res);
    } else {
      res.download(absolutePath, doc.originalName);
    }
  } catch (err) { next(err); }
}

async function emailShare(req, res, next) {
  try {
    const result = await sharingService.emailShare({
      documentId: req.body.documentId,
      folderId: req.body.folderId,
      emails: req.body.emails,
      expiresAt: req.body.expiresAt,
      createdById: req.user.id,
      organizationId: req.user.organizationId,
    });
    res.status(201).json(result);
  } catch (err) { next(err); }
}

module.exports = {
  createDocumentInvite, deleteDocumentInvite,
  createFolderInvite, deleteFolderInvite,
  createShareLink, listShareLinks, deleteShareLink,
  accessShareLink, downloadSharedFile, emailShare,
};
