'use strict';

const trashService = require('../services/trash.service');

async function list(req, res, next) {
  try {
    const result = await trashService.list({
      organizationId: req.user.organizationId,
    });
    res.json(result);
  } catch (err) { next(err); }
}

async function emptyAll(req, res, next) {
  try {
    const result = await trashService.emptyAll({
      organizationId: req.user.organizationId,
    });
    res.json(result);
  } catch (err) { next(err); }
}

module.exports = { list, emptyAll };
