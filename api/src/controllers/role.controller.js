'use strict';

const roleService = require('../services/role.service');

async function list(req, res, next) {
  try {
    const roles = await roleService.list({
      organizationId: req.user.organizationId,
    });
    res.json(roles);
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const role = await roleService.create({
      name: req.body.name,
      description: req.body.description,
      permissionIds: req.body.permissionIds,
      organizationId: req.user.organizationId,
    });
    res.status(201).json(role);
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const role = await roleService.update({
      id: parseInt(req.params.id, 10),
      ...req.body,
      organizationId: req.user.organizationId,
    });
    res.json(role);
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    const result = await roleService.remove({
      id: parseInt(req.params.id, 10),
      organizationId: req.user.organizationId,
    });
    res.json(result);
  } catch (err) { next(err); }
}

async function listPermissions(req, res, next) {
  try {
    const permissions = await roleService.listPermissions();
    res.json(permissions);
  } catch (err) { next(err); }
}

module.exports = { list, create, update, remove, listPermissions };
