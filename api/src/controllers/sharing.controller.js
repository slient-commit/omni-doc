'use strict';

const sharingService = require('../services/sharing.service');

async function createDocumentInvite(req, res, next) {
  try {
    const invite = await sharingService.createDocumentInvite({
      documentId: parseInt(req.params.id, 10),
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
      folderId: parseInt(req.params.id, 10),
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
    });
    res.status(201).json(link);
  } catch (err) { next(err); }
}

async function listShareLinks(req, res, next) {
  try {
    const links = await sharingService.listShareLinks({
      createdById: req.user.id,
    });
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

module.exports = {
  createDocumentInvite,
  deleteDocumentInvite,
  createFolderInvite,
  deleteFolderInvite,
  createShareLink,
  listShareLinks,
  deleteShareLink,
  accessShareLink,
};
