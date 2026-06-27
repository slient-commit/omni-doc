'use strict';

const fs = require('fs');
const path = require('path');
const prisma = require('../lib/prisma');
const { cleanupExpiredExports } = require('../services/export.service');
const config = require('../config');

// ponytail: runs at UTC midnight, deletes docs/folders trashed > TRASH_RETENTION_DAYS ago
async function cleanupTrash() {
  const cutoff = new Date(Date.now() - config.trashRetentionDays * 24 * 60 * 60 * 1000);
  console.log(`[trash-cleanup] Removing items trashed before ${cutoff.toISOString()}`);

  // Delete expired documents (physical files + DB records)
  const expiredDocs = await prisma.document.findMany({
    where: { deletedAt: { not: null, lt: cutoff } },
    include: { organization: { select: { storagePath: true } } },
  });

  for (const doc of expiredDocs) {
    const absPath = path.join(config.storagePath, doc.organization.storagePath, doc.filePath);
    try { fs.unlinkSync(absPath); } catch { /* already gone */ }
    await prisma.documentFolder.deleteMany({ where: { documentId: doc.id } });
    await prisma.documentInvite.deleteMany({ where: { documentId: doc.id } });
    await prisma.shareLink.deleteMany({ where: { documentId: doc.id } });
    await prisma.document.delete({ where: { id: doc.id } });
  }

  // Delete expired folders (DB records only — files are flat in org root)
  const expiredFolders = await prisma.folder.findMany({
    where: { deletedAt: { not: null, lt: cutoff } },
  });

  for (const folder of expiredFolders) {
    await prisma.documentFolder.deleteMany({ where: { folderId: folder.id } });
    await prisma.folderInvite.deleteMany({ where: { folderId: folder.id } });
    await prisma.shareLink.deleteMany({ where: { folderId: folder.id } });
    await prisma.folder.delete({ where: { id: folder.id } });
  }

  console.log(`[trash-cleanup] Removed ${expiredDocs.length} documents, ${expiredFolders.length} folders`);

  // ponytail: permanently delete orgs past retention period
  const orgCutoff = new Date(Date.now() - config.orgRetentionDays * 24 * 60 * 60 * 1000);
  const expiredOrgs = await prisma.organization.findMany({
    where: { deletedAt: { not: null, lt: orgCutoff } },
    select: { id: true, slug: true },
  });
  for (const org of expiredOrgs) {
    console.log(`[trash-cleanup] Permanently deleting org: ${org.slug}`);
    // ponytail: cascade via Prisma relations (onDelete: Cascade) handles most cleanup
    await prisma.organization.delete({ where: { id: org.id } });
  }
  if (expiredOrgs.length) console.log(`[trash-cleanup] Removed ${expiredOrgs.length} expired organizations`);

  // Cleanup expired zip exports
  await cleanupExpiredExports();
}

module.exports = { cleanupTrash };
