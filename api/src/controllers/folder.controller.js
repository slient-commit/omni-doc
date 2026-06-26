'use strict';

const folderService = require('../services/folder.service');

async function create(req, res, next) {
  try {
    const folder = await folderService.create({
      name: req.body.name,
      parentId: req.body.parentId ? parseInt(req.body.parentId, 10) : null,
      organizationId: req.user.organizationId,
      createdById: req.user.id,
    });
    res.status(201).json(folder);
  } catch (err) { next(err); }
}

async function list(req, res, next) {
  try {
    const parentId = req.query.parentId ? parseInt(req.query.parentId, 10) : null;
    const folders = await folderService.list({
      organizationId: req.user.organizationId,
      parentId,
      userId: req.user.id,
    });
    res.json(folders);
  } catch (err) { next(err); }
}

async function getById(req, res, next) {
  try {
    const folder = await folderService.getById({
      id: parseInt(req.params.id, 10),
      userId: req.user.id,
      organizationId: req.user.organizationId,
    });
    res.json(folder);
  } catch (err) { next(err); }
}

async function getAncestors(req, res, next) {
  try {
    const ancestors = await folderService.getAncestors(parseInt(req.params.id, 10));
    res.json(ancestors);
  } catch (err) { next(err); }
}

async function rename(req, res, next) {
  try {
    const folder = await folderService.rename({
      id: parseInt(req.params.id, 10),
      name: req.body.name,
      organizationId: req.user.organizationId,
    });
    res.json(folder);
  } catch (err) { next(err); }
}

async function softDelete(req, res, next) {
  try {
    const result = await folderService.softDelete({
      id: parseInt(req.params.id, 10),
      organizationId: req.user.organizationId,
    });
    res.json(result);
  } catch (err) { next(err); }
}

async function hardDelete(req, res, next) {
  try {
    const result = await folderService.hardDelete({
      id: parseInt(req.params.id, 10),
      organizationId: req.user.organizationId,
    });
    res.json(result);
  } catch (err) { next(err); }
}

async function restore(req, res, next) {
  try {
    const result = await folderService.restore({
      id: parseInt(req.params.id, 10),
      organizationId: req.user.organizationId,
    });
    res.json(result);
  } catch (err) { next(err); }
}

module.exports = { create, list, getById, getAncestors, rename, softDelete, hardDelete, restore };
