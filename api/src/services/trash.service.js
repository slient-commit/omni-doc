'use strict';

const fs = require('fs');
const prisma = require('../lib/prisma');
const { resolveFilePath } = require('../lib/filePath');

async function list({ organizationId }) {
  const [documents, folders] = await Promise.all([
    prisma.document.findMany({
      where: { organizationId, deletedAt: { not: null } },
      orderBy: { deletedAt: 'desc' },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        category: true,
      },
    }),
    prisma.folder.findMany({
      where: { organizationId, deletedAt: { not: null } },
      orderBy: { deletedAt: 'desc' },
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
    }),
  ]);

  return { documents, folders };
}

async function emptyAll({ organizationId }) {
  const documents = await prisma.document.findMany({
    where: { organizationId, deletedAt: { not: null } },
    include: { organization: { select: { storagePath: true } } },
  });

  // Remove physical files
  for (const doc of documents) {
    const absPath = resolveFilePath(doc.organization.storagePath, doc.filePath);
    try { fs.unlinkSync(absPath); } catch { /* file may already be gone */ }
  }

  const documentIds = documents.map((d) => d.id);

  const trashedFolders = await prisma.folder.findMany({
    where: { organizationId, deletedAt: { not: null } },
    select: { id: true },
  });
  const folderIds = trashedFolders.map((f) => f.id);

  await prisma.$transaction([
    // Clean up document relations
    prisma.documentFolder.deleteMany({ where: { documentId: { in: documentIds } } }),
    prisma.documentInvite.deleteMany({ where: { documentId: { in: documentIds } } }),
    prisma.shareLink.deleteMany({ where: { documentId: { in: documentIds } } }),
    prisma.document.deleteMany({ where: { id: { in: documentIds } } }),
    // Clean up folder relations
    prisma.folderInvite.deleteMany({ where: { folderId: { in: folderIds } } }),
    prisma.shareLink.deleteMany({ where: { folderId: { in: folderIds } } }),
    prisma.documentFolder.deleteMany({ where: { folderId: { in: folderIds } } }),
    prisma.folder.deleteMany({ where: { id: { in: folderIds } } }),
  ]);

  return { message: 'Trash emptied' };
}

module.exports = { list, emptyAll };
