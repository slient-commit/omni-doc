'use strict';

const folderService = require('../services/folder.service');

async function create(req, res, next) {
  try {
    const folder = await folderService.create({
      name: req.body.name,
      parentId: req.body.parentId || null,
      organizationId: req.user.organizationId,
      createdById: req.user.id,
    });
    res.status(201).json(folder);
  } catch (err) { next(err); }
}

async function list(req, res, next) {
  try {
    const parentId = req.query.parentId || null;
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
      id: req.params.id,
      userId: req.user.id,
      organizationId: req.user.organizationId,
    });
    res.json(folder);
  } catch (err) { next(err); }
}

async function getAncestors(req, res, next) {
  try {
    const ancestors = await folderService.getAncestors(req.params.id);
    res.json(ancestors);
  } catch (err) { next(err); }
}

async function rename(req, res, next) {
  try {
    const folder = await folderService.rename({
      id: req.params.id,
      name: req.body.name,
      organizationId: req.user.organizationId,
    });
    res.json(folder);
  } catch (err) { next(err); }
}

async function softDelete(req, res, next) {
  try {
    const result = await folderService.softDelete({
      id: req.params.id,
      organizationId: req.user.organizationId,
    });
    res.json(result);
  } catch (err) { next(err); }
}

async function hardDelete(req, res, next) {
  try {
    const result = await folderService.hardDelete({
      id: req.params.id,
      organizationId: req.user.organizationId,
    });
    res.json(result);
  } catch (err) { next(err); }
}

async function restore(req, res, next) {
  try {
    const result = await folderService.restore({
      id: req.params.id,
      organizationId: req.user.organizationId,
    });
    res.json(result);
  } catch (err) { next(err); }
}

module.exports = { create, list, getById, getAncestors, rename, softDelete, hardDelete, restore };
