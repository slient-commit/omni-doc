'use strict';

const fs = require('fs');
const path = require('path');
const prisma = require('../lib/prisma');
const config = require('../config');
const { documentVisibilityFilter } = require('../lib/visibility');

// ponytail: resolve folder uuid to numeric id for FK
async function resolveFolderId(identifier) {
  if (!identifier) return null;
  const num = Number(identifier);
  if (Number.isInteger(num)) return num;
  const folder = await prisma.folder.findUnique({ where: { uuid: identifier }, select: { id: true } });
  return folder?.id ?? null;
}

async function upload({ file, documentDate, categoryId, folderId, organizationId, createdById, isPrivate, metadata }) {
  const data = {
    originalName: file.originalname,
    storedFilename: file.filename,
    filePath: file.filename,
    mimeType: file.mimetype,
    fileSize: file.size,
    documentDate: new Date(documentDate),
    categoryId: categoryId ? parseInt(categoryId, 10) : null,
    organizationId,
    createdById,
    isPrivate: isPrivate === 'true' || isPrivate === true,
    metadata: metadata ? JSON.parse(metadata) : undefined,
  };

  const document = await prisma.document.create({ data });

  const resolvedFolderId = await resolveFolderId(folderId);
  if (resolvedFolderId) {
    await prisma.documentFolder.create({
      data: { documentId: document.id, folderId: resolvedFolderId },
    });
  }

  return document;
}

async function list({ organizationId, userId, folderId, categoryId, search, createdById }) {
  const user = { id: userId, organizationId };
  const where = { ...documentVisibilityFilter(user) };

  if (folderId) {
    const resolvedFid = await resolveFolderId(folderId);
    if (resolvedFid) where.documentFolders = { some: { folderId: resolvedFid } };
  }
  if (categoryId) {
    where.categoryId = parseInt(categoryId, 10);
  }
  if (search) {
    where.originalName = { contains: search };
  }
  if (createdById) {
    where.createdById = parseInt(createdById, 10);
  }

  return prisma.document.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      createdBy: { select: { id: true, firstName: true, lastName: true } },
      category: true,
      documentFolders: { include: { folder: { select: { id: true, name: true } } } },
    },
  });
}

// ponytail: accepts numeric id or string uuid
function idOrUuid(identifier) {
  const num = Number(identifier);
  return Number.isInteger(num) ? { id: num } : { uuid: identifier };
}

async function getById({ id, userId, organizationId }) {
  const user = { id: userId, organizationId };
  const document = await prisma.document.findFirst({
    where: { ...idOrUuid(id), ...documentVisibilityFilter(user) },
    include: {
      createdBy: { select: { id: true, firstName: true, lastName: true } },
      category: true,
      documentFolders: { include: { folder: { select: { id: true, name: true } } } },
      documentInvites: {
        include: { invitedUser: { select: { id: true, firstName: true, lastName: true, email: true } } },
      },
    },
  });
  if (!document) {
    const err = new Error('Document not found');
    err.status = 404;
    throw err;
  }
  return document;
}

function resolveFilePath(orgStoragePath, filePath) {
  return path.join(config.storagePath, orgStoragePath, filePath);
}

async function getDownloadInfo({ id, userId, organizationId }) {
  const user = { id: userId, organizationId };
  const doc = await prisma.document.findFirst({
    where: { ...idOrUuid(id), ...documentVisibilityFilter(user) },
    include: { organization: { select: { storagePath: true } } },
  });
  if (!doc) {
    const err = new Error('Document not found');
    err.status = 404;
    throw err;
  }
  return {
    absolutePath: resolveFilePath(doc.organization.storagePath, doc.filePath),
    originalName: doc.originalName,
  };
}

async function update({ id, originalName, categoryId, documentDate, metadata, organizationId }) {
  const doc = await prisma.document.findFirst({
    where: { id, organizationId, deletedAt: null },
  });
  if (!doc) {
    const err = new Error('Document not found');
    err.status = 404;
    throw err;
  }

  const data = {};
  if (originalName !== undefined) data.originalName = originalName;
  if (categoryId !== undefined) data.categoryId = categoryId ? parseInt(categoryId, 10) : null;
  if (documentDate !== undefined) data.documentDate = new Date(documentDate);
  if (metadata !== undefined) data.metadata = metadata;

  return prisma.document.update({ where: { id }, data });
}

async function softDelete({ id, organizationId }) {
  const doc = await prisma.document.findFirst({
    where: { id, organizationId, deletedAt: null },
  });
  if (!doc) {
    const err = new Error('Document not found');
    err.status = 404;
    throw err;
  }
  await prisma.document.update({ where: { id }, data: { deletedAt: new Date() } });
  return { message: 'Document moved to trash' };
}

async function hardDelete({ id, organizationId }) {
  const doc = await prisma.document.findFirst({
    where: { id, organizationId },
    include: { organization: { select: { storagePath: true } } },
  });
  if (!doc) {
    const err = new Error('Document not found');
    err.status = 404;
    throw err;
  }

  // Remove physical file
  const absPath = resolveFilePath(doc.organization.storagePath, doc.filePath);
  try { fs.unlinkSync(absPath); } catch { /* file may already be gone */ }

  await prisma.$transaction([
    prisma.documentFolder.deleteMany({ where: { documentId: id } }),
    prisma.documentInvite.deleteMany({ where: { documentId: id } }),
    prisma.shareLink.deleteMany({ where: { documentId: id } }),
    prisma.document.delete({ where: { id } }),
  ]);

  return { message: 'Document permanently deleted' };
}

async function restore({ id, organizationId }) {
  const doc = await prisma.document.findFirst({
    where: { id, organizationId, deletedAt: { not: null } },
  });
  if (!doc) {
    const err = new Error('Document not found in trash');
    err.status = 404;
    throw err;
  }
  await prisma.document.update({ where: { id }, data: { deletedAt: null } });
  return { message: 'Document restored' };
}

async function move({ id, folderIds, organizationId }) {
  const doc = await prisma.document.findFirst({
    where: { id, organizationId, deletedAt: null },
  });
  if (!doc) {
    const err = new Error('Document not found');
    err.status = 404;
    throw err;
  }

  await prisma.$transaction([
    prisma.documentFolder.deleteMany({ where: { documentId: id } }),
    ...folderIds.map((folderId) =>
      prisma.documentFolder.create({ data: { documentId: id, folderId } }),
    ),
  ]);

  return { message: 'Document moved' };
}

module.exports = { upload, list, getById, getDownloadInfo, update, softDelete, hardDelete, restore, move };
