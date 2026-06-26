'use strict';

const prisma = require('../lib/prisma');
const { folderVisibilityFilter } = require('../lib/visibility');

// ponytail: accepts numeric id or string uuid
function idOrUuid(identifier) {
  const num = Number(identifier);
  return Number.isInteger(num) ? { id: num } : { uuid: identifier };
}

async function create({ name, parentId, organizationId, createdById }) {
  const resolvedParentId = await resolveId(parentId);
  if (parentId && !resolvedParentId) {
    const err = new Error('Parent folder not found');
    err.status = 404;
    throw err;
  }
  return prisma.folder.create({
    data: { name, parentId: resolvedParentId, organizationId, createdById },
  });
}

// ponytail: resolve uuid to numeric id for FK lookups
async function resolveId(identifier) {
  if (!identifier) return null;
  const num = Number(identifier);
  if (Number.isInteger(num)) return num;
  const folder = await prisma.folder.findUnique({ where: { uuid: identifier }, select: { id: true } });
  return folder?.id ?? null;
}

async function list({ organizationId, parentId, userId }) {
  const user = { id: userId, organizationId };
  const resolvedParentId = await resolveId(parentId);
  const where = {
    ...folderVisibilityFilter(user),
    parentId: resolvedParentId,
  };
  return prisma.folder.findMany({
    where,
    orderBy: { name: 'asc' },
    include: {
      _count: { select: { children: true, documentFolders: true } },
      createdBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });
}

async function getById({ id, userId, organizationId }) {
  const user = { id: userId, organizationId };
  const folder = await prisma.folder.findFirst({
    where: { ...idOrUuid(id), ...folderVisibilityFilter(user) },
    include: {
      children: {
        where: { deletedAt: null },
        orderBy: { name: 'asc' },
        include: { _count: { select: { children: true, documentFolders: true } } },
      },
      documentFolders: {
        include: {
          document: {
            include: {
              createdBy: { select: { id: true, firstName: true, lastName: true } },
              category: true,
            },
          },
        },
      },
      createdBy: { select: { id: true, firstName: true, lastName: true } },
      folderInvites: {
        include: { invitedUser: { select: { id: true, firstName: true, lastName: true, email: true } } },
      },
    },
  });
  if (!folder) {
    const err = new Error('Folder not found');
    err.status = 404;
    throw err;
  }
  return folder;
}

async function getAncestors(id) {
  const ancestors = [];
  let currentId = await resolveId(id);
  while (currentId) {
    const folder = await prisma.folder.findUnique({
      where: { id: currentId },
      select: { id: true, uuid: true, name: true, parentId: true },
    });
    if (!folder) break;
    ancestors.unshift(folder);
    currentId = folder.parentId;
  }
  return ancestors;
}

async function rename({ id, name, organizationId }) {
  const folder = await prisma.folder.findFirst({
    where: { ...idOrUuid(id), organizationId, deletedAt: null },
  });
  if (!folder) {
    const err = new Error('Folder not found');
    err.status = 404;
    throw err;
  }
  return prisma.folder.update({ where: { id: folder.id }, data: { name } });
}

async function getDescendantFolderIds(folderId) {
  const ids = [];
  const children = await prisma.folder.findMany({
    where: { parentId: folderId },
    select: { id: true },
  });
  for (const child of children) {
    ids.push(child.id);
    const nested = await getDescendantFolderIds(child.id);
    ids.push(...nested);
  }
  return ids;
}

async function softDelete({ id, organizationId }) {
  const folder = await prisma.folder.findFirst({
    where: { ...idOrUuid(id), organizationId, deletedAt: null },
  });
  if (!folder) {
    const err = new Error('Folder not found');
    err.status = 404;
    throw err;
  }

  const descendantIds = await getDescendantFolderIds(folder.id);
  const allFolderIds = [folder.id, ...descendantIds];
  const now = new Date();

  await prisma.$transaction([
    prisma.folder.updateMany({
      where: { id: { in: allFolderIds } },
      data: { deletedAt: now },
    }),
    prisma.document.updateMany({
      where: {
        documentFolders: { some: { folderId: { in: allFolderIds } } },
        deletedAt: null,
      },
      data: { deletedAt: now },
    }),
  ]);

  return { message: 'Folder moved to trash' };
}

async function hardDelete({ id, organizationId }) {
  const folder = await prisma.folder.findFirst({
    where: { ...idOrUuid(id), organizationId },
  });
  if (!folder) {
    const err = new Error('Folder not found');
    err.status = 404;
    throw err;
  }

  const descendantIds = await getDescendantFolderIds(folder.id);
  const allFolderIds = [folder.id, ...descendantIds];

  await prisma.$transaction([
    prisma.documentFolder.deleteMany({ where: { folderId: { in: allFolderIds } } }),
    prisma.folderInvite.deleteMany({ where: { folderId: { in: allFolderIds } } }),
    prisma.shareLink.deleteMany({ where: { folderId: { in: allFolderIds } } }),
    prisma.folder.deleteMany({ where: { id: { in: allFolderIds } } }),
  ]);

  return { message: 'Folder permanently deleted' };
}

async function restore({ id, organizationId }) {
  const folder = await prisma.folder.findFirst({
    where: { ...idOrUuid(id), organizationId, deletedAt: { not: null } },
  });
  if (!folder) {
    const err = new Error('Folder not found in trash');
    err.status = 404;
    throw err;
  }

  const descendantIds = await getDescendantFolderIds(folder.id);
  const allFolderIds = [folder.id, ...descendantIds];

  await prisma.$transaction([
    prisma.folder.updateMany({
      where: { id: { in: allFolderIds } },
      data: { deletedAt: null },
    }),
    prisma.document.updateMany({
      where: {
        documentFolders: { some: { folderId: { in: allFolderIds } } },
        deletedAt: { not: null },
      },
      data: { deletedAt: null },
    }),
  ]);

  return { message: 'Folder restored' };
}

module.exports = { create, list, getById, getAncestors, rename, softDelete, hardDelete, restore };
