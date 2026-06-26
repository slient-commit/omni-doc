'use strict';

const organizationService = require('../services/organization.service');

async function get(req, res, next) {
  try {
    const org = await organizationService.get({
      organizationId: req.user.organizationId,
    });
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

module.exports = { get, update };
