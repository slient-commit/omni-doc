'use strict';

const organizationService = require('../services/organization.service');
const exportService = require('../services/export.service');

async function get(req, res, next) {
  try {
    const org = await organizationService.get({ organizationId: req.user.organizationId });
    res.json(org);
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const org = await organizationService.update({
      organizationId: req.user.organizationId,
      name: req.body.name,
    });
    res.json(org);
  } catch (err) { next(err); }
}

async function softDelete(req, res, next) {
  try {
    const result = await organizationService.softDelete({
      organizationId: req.user.organizationId,
      userId: req.user.id,
      userEmail: req.user.email,
      confirmEmail: req.body.confirmEmail,
    });
    res.json(result);
  } catch (err) { next(err); }
}

async function recover(req, res, next) {
  try {
    const result = await organizationService.recover({
      organizationId: req.user.organizationId,
      userId: req.user.id,
      userEmail: req.user.email,
      confirmEmail: req.body.confirmEmail,
    });
    res.json(result);
  } catch (err) { next(err); }
}

async function requestExport(req, res, next) {
  try {
    const job = await exportService.requestExport({
      organizationId: req.user.organizationId,
      userId: req.user.id,
    });
    res.status(201).json(job);
  } catch (err) { next(err); }
}

async function listExports(req, res, next) {
  try {
    const exports = await exportService.listExports({ organizationId: req.user.organizationId });
    res.json(exports);
  } catch (err) { next(err); }
}

async function downloadExport(req, res, next) {
  try {
    const absPath = await exportService.downloadExport({
      id: parseInt(req.params.id, 10),
      organizationId: req.user.organizationId,
    });
    res.download(absPath);
  } catch (err) { next(err); }
}

module.exports = { get, update, softDelete, recover, requestExport, listExports, downloadExport };
