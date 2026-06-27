'use strict';

const organizationService = require('../services/organization.service');

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

module.exports = { get, update, softDelete, recover };
