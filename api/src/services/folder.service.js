'use strict';

const prisma = require('../lib/prisma');
const { folderVisibilityFilter } = require('../lib/visibility');

async function create({ name, parentId, organizationId, createdById }) {
  if (parentId) {
    const parent = await prisma.folder.findFirst({
      where: { id: parentId, organizationId, deletedAt: null },
    });
    if (!parent) {
      const err = new Error('Parent folder not found');
      err.status = 404;
      throw err;
    }
  }
  return prisma.folder.create({
    data: { name, parentId: parentId || null, organizationId, createdById },
  });
}

async function list({ organizationId, parentId, userId }) {
  const user = { id: userId, organizationId };
  const where = {
    ...folderVisibilityFilter(user),
    parentId: parentId || null,
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
    where: { id, ...folderVisibilityFilter(user) },
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
  let currentId = id;
  while (currentId) {
    const folder = await prisma.folder.findUnique({
      where: { id: currentId },
      select: { id: true, name: true, parentId: true },
    });
    if (!folder) break;
    ancestors.unshift(folder);
    currentId = folder.parentId;
  }
  return ancestors;
}

async function rename({ id, name, organizationId }) {
  const folder = await prisma.folder.findFirst({
    where: { id, organizationId, deletedAt: null },
  });
  if (!folder) {
    const err = new Error('Folder not found');
    err.status = 404;
    throw err;
  }
  return prisma.folder.update({ where: { id }, data: { name } });
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
    where: { id, organizationId, deletedAt: null },
  });
  if (!folder) {
    const err = new Error('Folder not found');
    err.status = 404;
    throw err;
  }

  const descendantIds = await getDescendantFolderIds(id);
  const allFolderIds = [id, ...descendantIds];
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
    where: { id, organizationId },
  });
  if (!folder) {
    const err = new Error('Folder not found');
    err.status = 404;
    throw err;
  }

  const descendantIds = await getDescendantFolderIds(id);
  const allFolderIds = [id, ...descendantIds];

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
    where: { id, organizationId, deletedAt: { not: null } },
  });
  if (!folder) {
    const err = new Error('Folder not found in trash');
    err.status = 404;
    throw err;
  }

  const descendantIds = await getDescendantFolderIds(id);
  const allFolderIds = [id, ...descendantIds];

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
