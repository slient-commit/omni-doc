'use strict';

const prisma = require('../lib/prisma');
const { folderVisibilityFilter, sharedWithMeFolderFilter } = require('../lib/visibility');
const { checkItemPermission } = require('../lib/authorize');

// ponytail: accepts numeric id or string uuid
function idOrUuid(identifier) {
  const num = Number(identifier);
  return Number.isInteger(num) ? { id: num } : { uuid: identifier };
}

async function create({ name, parentId, organizationId, createdById, isPrivate, allowEdit = true, allowDelete = true, allowMove = true, allowCopy = true }) {
  const resolvedParentId = await resolveId(parentId);
  if (parentId && !resolvedParentId) {
    const err = new Error('Parent folder not found');
    err.status = 404;
    throw err;
  }
  // Inherit privacy from parent if parent is private
  let effectivePrivate = isPrivate || false;
  if (resolvedParentId && !effectivePrivate) {
    const parent = await prisma.folder.findUnique({ where: { id: resolvedParentId }, select: { isPrivate: true } });
    if (parent?.isPrivate) effectivePrivate = true;
  }
  return prisma.folder.create({
    data: { name, parentId: resolvedParentId, organizationId, createdById, isPrivate: effectivePrivate, allowEdit, allowDelete, allowMove, allowCopy },
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

async function list({ organizationId, parentId, userId, sharedWithMe, page = 1, limit = 100 }) {
  const user = { id: userId, organizationId };
  const resolvedParentId = await resolveId(parentId);
  const baseFilter = sharedWithMe ? sharedWithMeFolderFilter(user) : folderVisibilityFilter(user);
  const where = {
    ...baseFilter,
    ...(sharedWithMe ? {} : { parentId: resolvedParentId }),
  };
  return prisma.folder.findMany({
    where,
    orderBy: { name: 'asc' },
    skip: (Math.max(1, page) - 1) * Math.min(limit, 500),
    take: Math.min(limit, 500),
    include: {
      _count: {
        select: {
          children: { where: { deletedAt: null, OR: [{ isPrivate: false }, { createdById: userId }] } },
          documentFolders: { where: { document: { deletedAt: null, OR: [{ isPrivate: false }, { createdById: userId }] } } },
        },
      },
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
        where: { deletedAt: null, OR: [{ isPrivate: false }, { createdById: userId }] },
        orderBy: { name: 'asc' },
        include: { _count: { select: { children: { where: { deletedAt: null, OR: [{ isPrivate: false }, { createdById: userId }] } }, documentFolders: { where: { document: { deletedAt: null, OR: [{ isPrivate: false }, { createdById: userId }] } } } } } },
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

async function rename({ id, name, isPrivate, allowEdit, allowDelete, allowMove, allowCopy, organizationId, userId }) {
  const folder = await prisma.folder.findFirst({
    where: { ...idOrUuid(id), ...folderVisibilityFilter({ id: userId, organizationId }) },
  });
  if (!folder) {
    const err = new Error('Folder not found');
    err.status = 404;
    throw err;
  }
  checkItemPermission(folder, userId, 'edit');

  const data = {};
  if (name !== undefined) data.name = name;

  // Owner-only fields
  if (folder.createdById === userId) {
    if (allowEdit !== undefined) data.allowEdit = allowEdit;
    if (allowDelete !== undefined) data.allowDelete = allowDelete;
    if (allowMove !== undefined) data.allowMove = allowMove;
    if (allowCopy !== undefined) data.allowCopy = allowCopy;
  }

  if (isPrivate !== undefined && folder.createdById !== userId) {
    const err = new Error('Only the owner can change privacy');
    err.status = 403;
    throw err;
  }
  if (isPrivate !== undefined) {
    data.isPrivate = isPrivate;
    // Cascade privacy to all descendant folders and their documents
    const descendantIds = await getDescendantFolderIds(folder.id);
    const allFolderIds = [folder.id, ...descendantIds];
    await prisma.folder.updateMany({
      where: { id: { in: allFolderIds } },
      data: { isPrivate },
    });
    await prisma.document.updateMany({
      where: { documentFolders: { some: { folderId: { in: allFolderIds } } } },
      data: { isPrivate },
    });
  }
  return prisma.folder.update({ where: { id: folder.id }, data });
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

async function softDelete({ id, organizationId, userId }) {
  const folder = await prisma.folder.findFirst({
    where: { ...idOrUuid(id), ...folderVisibilityFilter({ id: userId, organizationId }) },
  });
  if (!folder) {
    const err = new Error('Folder not found');
    err.status = 404;
    throw err;
  }
  checkItemPermission(folder, userId, 'delete');

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

async function hardDelete({ id, organizationId, userId }) {
  const folder = await prisma.folder.findFirst({
    where: { ...idOrUuid(id), organizationId, OR: [{ isPrivate: false }, { createdById: userId }] },
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

async function restore({ id, organizationId, userId }) {
  const folder = await prisma.folder.findFirst({
    where: { ...idOrUuid(id), organizationId, deletedAt: { not: null }, OR: [{ isPrivate: false }, { createdById: userId }] },
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

async function move({ id, targetParentId, organizationId, userId }) {
  const folder = await prisma.folder.findFirst({
    where: { ...idOrUuid(id), ...folderVisibilityFilter({ id: userId, organizationId }) },
  });
  if (!folder) {
    const err = new Error('Folder not found');
    err.status = 404;
    throw err;
  }
  checkItemPermission(folder, userId, 'move');
  // Prevent moving a folder into itself or its descendants
  if (targetParentId) {
    const descendants = await getDescendantFolderIds(folder.id);
    const resolvedTarget = await resolveId(targetParentId);
    if (resolvedTarget === folder.id || descendants.includes(resolvedTarget)) {
      const err = new Error('Cannot move a folder into itself or its subfolder');
      err.status = 400;
      throw err;
    }
  }
  const newParentId = await resolveId(targetParentId);
  await prisma.folder.update({ where: { id: folder.id }, data: { parentId: newParentId } });
  return { message: 'Folder moved' };
}

async function copy({ id, targetParentId, organizationId, createdById, userId }) {
  const source = await prisma.folder.findFirst({
    where: { ...idOrUuid(id), ...folderVisibilityFilter({ id: userId || createdById, organizationId }) },
    include: { organization: { select: { storagePath: true } } },
  });
  if (!source) {
    const err = new Error('Folder not found');
    err.status = 404;
    throw err;
  }
  checkItemPermission(source, userId || createdById, 'copy');
  const newParentId = await resolveId(targetParentId);

  // ponytail: deep copy — recursively copies folder, subfolders, and documents (with physical file clones)
  async function copyFolderRecursive(sourceFolderId, parentId) {
    const srcFolder = await prisma.folder.findUnique({ where: { id: sourceFolderId } });
    const newFolder = await prisma.folder.create({
      data: { name: srcFolder.name, parentId, organizationId, createdById },
    });

    // Copy documents in this folder
    const docLinks = await prisma.documentFolder.findMany({
      where: { folderId: sourceFolderId },
      include: { document: true },
    });
    const fs = require('fs');
    const path = require('path');
    const crypto = require('crypto');
    const config = require('../config');
    const orgDir = path.join(config.storagePath, source.organization.storagePath);

    for (const link of docLinks) {
      const doc = link.document;
      if (doc.deletedAt) continue;
      const ext = path.extname(doc.storedFilename);
      const newFilename = `${crypto.randomUUID()}${ext}`;
      try { fs.copyFileSync(path.join(orgDir, doc.filePath), path.join(orgDir, newFilename)); } catch { continue; }
      const copy = await prisma.document.create({
        data: {
          originalName: doc.originalName,
          storedFilename: newFilename,
          filePath: newFilename,
          mimeType: doc.mimeType,
          fileSize: doc.fileSize,
          documentDate: doc.documentDate,
          categoryId: doc.categoryId,
          organizationId,
          createdById,
          isPrivate: doc.isPrivate,
          metadata: doc.metadata ?? undefined,
        },
      });
      await prisma.documentFolder.create({ data: { documentId: copy.id, folderId: newFolder.id } });
    }

    // Copy child folders recursively
    const children = await prisma.folder.findMany({
      where: { parentId: sourceFolderId, deletedAt: null },
    });
    for (const child of children) {
      await copyFolderRecursive(child.id, newFolder.id);
    }

    return newFolder;
  }

  const copied = await copyFolderRecursive(source.id, newParentId);
  return copied;
}

module.exports = { create, list, getById, getAncestors, rename, softDelete, hardDelete, restore, move, copy };
