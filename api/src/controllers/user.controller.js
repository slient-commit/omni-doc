'use strict';

const userService = require('../services/user.service');

async function list(req, res, next) {
  try {
    const users = await userService.list({
      organizationId: req.user.organizationId,
    });
    res.json(users);
  } catch (err) { next(err); }
}

async function invite(req, res, next) {
  try {
    const user = await userService.invite({
      email: req.body.email,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      roleId: req.body.roleId,
      organizationId: req.user.organizationId,
      invitedById: req.user.id,
    });
    res.status(201).json(user);
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const user = await userService.update({
      id: parseInt(req.params.id, 10),
      ...req.body,
      organizationId: req.user.organizationId,
    });
    res.json(user);
  } catch (err) { next(err); }
}

async function deactivate(req, res, next) {
  try {
    const result = await userService.deactivate({
      id: parseInt(req.params.id, 10),
      organizationId: req.user.organizationId,
    });
    res.json(result);
  } catch (err) { next(err); }
}

module.exports = { list, invite, update, deactivate };
