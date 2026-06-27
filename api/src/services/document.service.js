'use strict';

const fs = require('fs');
const path = require('path');
const prisma = require('../lib/prisma');
const config = require('../config');
const { documentVisibilityFilter, sharedWithMeDocumentFilter } = require('../lib/visibility');

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

async function list({ organizationId, userId, folderId, categoryId, search, createdById, sharedWithMe }) {
  const user = { id: userId, organizationId };
  const where = sharedWithMe ? { ...sharedWithMeDocumentFilter(user) } : { ...documentVisibilityFilter(user) };

  if (folderId) {
    const resolvedFid = await resolveFolderId(folderId);
    if (resolvedFid) where.documentFolders = { some: { folderId: resolvedFid } };
  } else if (!createdById && !sharedWithMe) {
    // ponytail: root view — only show documents not in any folder
    where.documentFolders = { none: {} };
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
    where: { ...idOrUuid(id), organizationId, deletedAt: null },
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

  return prisma.document.update({ where: { id: doc.id }, data });
}

async function softDelete({ id, organizationId }) {
  const doc = await prisma.document.findFirst({
    where: { ...idOrUuid(id), organizationId, deletedAt: null },
  });
  if (!doc) {
    const err = new Error('Document not found');
    err.status = 404;
    throw err;
  }
  await prisma.document.update({ where: { id: doc.id }, data: { deletedAt: new Date() } });
  return { message: 'Document moved to trash' };
}

async function hardDelete({ id, organizationId }) {
  const doc = await prisma.document.findFirst({
    where: { ...idOrUuid(id), organizationId },
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
    prisma.documentFolder.deleteMany({ where: { documentId: doc.id } }),
    prisma.documentInvite.deleteMany({ where: { documentId: doc.id } }),
    prisma.shareLink.deleteMany({ where: { documentId: doc.id } }),
    prisma.document.delete({ where: { id: doc.id } }),
  ]);

  return { message: 'Document permanently deleted' };
}

async function restore({ id, organizationId }) {
  const doc = await prisma.document.findFirst({
    where: { ...idOrUuid(id), organizationId, deletedAt: { not: null } },
  });
  if (!doc) {
    const err = new Error('Document not found in trash');
    err.status = 404;
    throw err;
  }
  await prisma.document.update({ where: { id: doc.id }, data: { deletedAt: null } });
  return { message: 'Document restored' };
}

async function move({ id, folderIds, organizationId }) {
  const doc = await prisma.document.findFirst({
    where: { ...idOrUuid(id), organizationId, deletedAt: null },
  });
  if (!doc) {
    const err = new Error('Document not found');
    err.status = 404;
    throw err;
  }

  // ponytail: files stay flat in org root — move only changes the virtual folder link
  await prisma.$transaction([
    prisma.documentFolder.deleteMany({ where: { documentId: doc.id } }),
    ...folderIds.map((folderId) =>
      prisma.documentFolder.create({ data: { documentId: doc.id, folderId } }),
    ),
  ]);

  return { message: 'Document moved' };
}

// ponytail: in-place copy — duplicates file in same folder(s) with incremented name
async function copyToFolder({ id, organizationId }) {
  const doc = await prisma.document.findFirst({
    where: { ...idOrUuid(id), organizationId, deletedAt: null },
    include: {
      organization: { select: { storagePath: true } },
      documentFolders: { select: { folderId: true } },
    },
  });
  if (!doc) {
    const err = new Error('Document not found');
    err.status = 404;
    throw err;
  }

  // Increment name: "file.pdf" -> "file (1).pdf", "file (1).pdf" -> "file (2).pdf"
  const ext = path.extname(doc.originalName);
  const base = path.basename(doc.originalName, ext);
  const match = base.match(/^(.+?)\s*\((\d+)\)$/);
  const coreName = match ? match[1] : base;
  const nextNum = match ? parseInt(match[2], 10) + 1 : 1;
  const newOriginalName = `${coreName} (${nextNum})${ext}`;

  // Clone physical file
  const crypto = require('crypto');
  const newStoredFilename = `${crypto.randomUUID()}${path.extname(doc.storedFilename)}`;
  const orgDir = path.join(config.storagePath, doc.organization.storagePath);

  try {
    fs.copyFileSync(path.join(orgDir, doc.filePath), path.join(orgDir, newStoredFilename));
  } catch (copyErr) {
    console.error('[document] Copy failed:', copyErr.message);
    const e = new Error(`Failed to copy file: ${copyErr.message}`);
    e.status = 500;
    throw e;
  }

  const copy = await prisma.document.create({
    data: {
      originalName: newOriginalName,
      storedFilename: newStoredFilename,
      filePath: newStoredFilename,
      mimeType: doc.mimeType,
      fileSize: doc.fileSize,
      documentDate: doc.documentDate,
      categoryId: doc.categoryId,
      organizationId: doc.organizationId,
      createdById: doc.createdById,
      isPrivate: doc.isPrivate,
      metadata: doc.metadata ?? undefined,
    },
  });

  // Link copy to same folders as source
  for (const link of doc.documentFolders) {
    await prisma.documentFolder.create({
      data: { documentId: copy.id, folderId: link.folderId },
    });
  }

  return copy;
}

module.exports = { upload, list, getById, getDownloadInfo, update, softDelete, hardDelete, restore, move, copyToFolder };
