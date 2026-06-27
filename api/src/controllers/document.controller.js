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
    res.download(absolutePath, originalName);
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const doc = await documentService.update({
      id: parseInt(req.params.id, 10),
      ...req.body,
      organizationId: req.user.organizationId,
    });
    res.json(doc);
  } catch (err) { next(err); }
}

async function softDelete(req, res, next) {
  try {
    const result = await documentService.softDelete({
      id: parseInt(req.params.id, 10),
      organizationId: req.user.organizationId,
    });
    res.json(result);
  } catch (err) { next(err); }
}

async function hardDelete(req, res, next) {
  try {
    const result = await documentService.hardDelete({
      id: parseInt(req.params.id, 10),
      organizationId: req.user.organizationId,
    });
    res.json(result);
  } catch (err) { next(err); }
}

async function restore(req, res, next) {
  try {
    const result = await documentService.restore({
      id: parseInt(req.params.id, 10),
      organizationId: req.user.organizationId,
    });
    res.json(result);
  } catch (err) { next(err); }
}

async function move(req, res, next) {
  try {
    const result = await documentService.move({
      id: parseInt(req.params.id, 10),
      folderIds: req.body.folderIds,
      organizationId: req.user.organizationId,
    });
    res.json(result);
  } catch (err) { next(err); }
}

module.exports = { upload, list, getById, download, update, softDelete, hardDelete, restore, move };
