'use strict';

const prisma = require('../lib/prisma');

async function list({ organizationId }) {
  return prisma.role.findMany({
    where: { organizationId },
    orderBy: { name: 'asc' },
    include: {
      _count: { select: { rolePermissions: true, users: true } },
      rolePermissions: { select: { permissionId: true } },
    },
  });
}

async function create({ name, description, permissionIds, organizationId }) {
  return prisma.role.create({
    data: {
      name,
      description,
      organizationId,
      rolePermissions: {
        create: (permissionIds || []).map((permissionId) => ({ permissionId })),
      },
    },
    include: {
      _count: { select: { rolePermissions: true, users: true } },
    },
  });
}

async function update({ id, name, description, permissionIds, organizationId }) {
  const role = await prisma.role.findFirst({
    where: { id, organizationId },
  });
  if (!role) {
    const err = new Error('Role not found');
    err.status = 404;
    throw err;
  }

  if (role.isSystem) {
    const err = new Error('Cannot modify a system role');
    err.status = 403;
    throw err;
  }

  const data = {};
  if (name !== undefined) data.name = name;
  if (description !== undefined) data.description = description;

  if (permissionIds !== undefined) {
    // Replace all permissions
    await prisma.rolePermission.deleteMany({ where: { roleId: id } });
    await prisma.rolePermission.createMany({
      data: permissionIds.map((permissionId) => ({ roleId: id, permissionId })),
    });
  }

  return prisma.role.update({
    where: { id },
    data,
    include: {
      _count: { select: { rolePermissions: true, users: true } },
    },
  });
}

async function remove({ id, organizationId }) {
  const role = await prisma.role.findFirst({
    where: { id, organizationId },
    include: { _count: { select: { users: true } } },
  });
  if (!role) {
    const err = new Error('Role not found');
    err.status = 404;
    throw err;
  }

  if (role.isSystem) {
    const err = new Error('Cannot delete a system role');
    err.status = 403;
    throw err;
  }

  if (role._count.users > 0) {
    const err = new Error('Cannot delete a role that has users assigned');
    err.status = 409;
    throw err;
  }

  await prisma.$transaction([
    prisma.rolePermission.deleteMany({ where: { roleId: id } }),
    prisma.role.delete({ where: { id } }),
  ]);

  return { message: 'Role deleted' };
}

async function listPermissions() {
  return prisma.permission.findMany({
    orderBy: [{ subject: 'asc' }, { action: 'asc' }],
  });
}

async function myPermissions({ roleId }) {
  const perms = await prisma.rolePermission.findMany({
    where: { roleId },
    include: { permission: true },
  });
  return perms.map((rp) => ({ action: rp.permission.action, subject: rp.permission.subject }));
}

module.exports = { list, create, update, remove, listPermissions, myPermissions };
