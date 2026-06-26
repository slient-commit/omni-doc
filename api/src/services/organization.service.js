'use strict';

const prisma = require('../lib/prisma');

async function get({ organizationId }) {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
  });
  if (!org) {
    const err = new Error('Organization not found');
    err.status = 404;
    throw err;
  }
  return org;
}

async function update({ organizationId, name }) {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
  });
  if (!org) {
    const err = new Error('Organization not found');
    err.status = 404;
    throw err;
  }

  return prisma.organization.update({
    where: { id: organizationId },
    data: { name },
  });
}

module.exports = { get, update };
