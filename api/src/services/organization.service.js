'use strict';

const prisma = require('../lib/prisma');
const config = require('../config');

async function get({ organizationId }) {
  const org = await prisma.organization.findUnique({ where: { id: organizationId } });
  if (!org) {
    const err = new Error('Organization not found');
    err.status = 404;
    throw err;
  }
  return { ...org, orgRetentionDays: config.orgRetentionDays };
}

async function update({ organizationId, name }) {
  const org = await prisma.organization.findUnique({ where: { id: organizationId } });
  if (!org) {
    const err = new Error('Organization not found');
    err.status = 404;
    throw err;
  }
  return prisma.organization.update({ where: { id: organizationId }, data: { name } });
}

async function softDelete({ organizationId, userId, userEmail, confirmEmail }) {
  if (userEmail !== confirmEmail) {
    const err = new Error('Email confirmation does not match');
    err.status = 400;
    throw err;
  }

  // Verify user is the org creator (first user with system Owner role)
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { role: true },
  });
  if (!user || !user.role.isSystem) {
    const err = new Error('Only the organization owner can delete the organization');
    err.status = 403;
    throw err;
  }

  await prisma.organization.update({
    where: { id: organizationId },
    data: { deletedAt: new Date(), deletedById: userId },
  });

  return { message: 'Organization scheduled for deletion', retentionDays: config.orgRetentionDays };
}

async function recover({ organizationId, userId, userEmail, confirmEmail }) {
  if (userEmail !== confirmEmail) {
    const err = new Error('Email confirmation does not match');
    err.status = 400;
    throw err;
  }

  const org = await prisma.organization.findUnique({ where: { id: organizationId } });
  if (!org || !org.deletedAt) {
    const err = new Error('Organization is not scheduled for deletion');
    err.status = 400;
    throw err;
  }

  if (org.deletedById !== userId) {
    const err = new Error('Only the user who deleted the organization can recover it');
    err.status = 403;
    throw err;
  }

  // Check if still within recovery period
  const expiresAt = new Date(org.deletedAt.getTime() + config.orgRetentionDays * 24 * 60 * 60 * 1000);
  if (Date.now() > expiresAt.getTime()) {
    const err = new Error('Recovery period has expired');
    err.status = 410;
    throw err;
  }

  await prisma.organization.update({
    where: { id: organizationId },
    data: { deletedAt: null, deletedById: null },
  });

  return { message: 'Organization recovered successfully' };
}

module.exports = { get, update, softDelete, recover };
