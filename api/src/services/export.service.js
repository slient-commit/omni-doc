'use strict';

const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const prisma = require('../lib/prisma');
const config = require('../config');

async function requestExport({ organizationId, userId }) {
  const expiresAt = new Date(Date.now() + config.zipExpiryHours * 60 * 60 * 1000);

  const job = await prisma.orgExport.create({
    data: {
      organizationId,
      requestedById: userId,
      status: 'pending',
      expiresAt,
    },
  });

  // ponytail: fire-and-forget background zip generation
  generateZip(job.id, organizationId, userId).catch((err) => {
    console.error('[export] Zip generation failed:', err.message);
    prisma.orgExport.update({
      where: { id: job.id },
      data: { status: 'failed', error: err.message },
    }).catch(() => {});
  });

  return job;
}

async function generateZip(jobId, organizationId, userId) {
  await prisma.orgExport.update({ where: { id: jobId }, data: { status: 'processing' } });

  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { slug: true, storagePath: true },
  });

  // Get all non-deleted, non-private (or owned) documents
  const documents = await prisma.document.findMany({
    where: {
      organizationId,
      deletedAt: null,
      OR: [{ isPrivate: false }, { createdById: userId }],
    },
    include: {
      documentFolders: {
        include: { folder: { select: { id: true, name: true, parentId: true } } },
      },
    },
  });

  // Build folder path map
  const allFolders = await prisma.folder.findMany({
    where: {
      organizationId,
      deletedAt: null,
      OR: [{ isPrivate: false }, { createdById: userId }],
    },
    select: { id: true, name: true, parentId: true },
  });

  const folderMap = new Map(allFolders.map((f) => [f.id, f]));

  function getFolderPath(folderId) {
    const parts = [];
    let current = folderId;
    while (current) {
      const folder = folderMap.get(current);
      if (!folder) break;
      parts.unshift(folder.name);
      current = folder.parentId;
    }
    return parts.join('/');
  }

  // Create zip
  const exportDir = path.join(config.storagePath, 'exports');
  fs.mkdirSync(exportDir, { recursive: true });
  const zipFilename = `${org.slug}-${Date.now()}.zip`;
  const zipPath = path.join(exportDir, zipFilename);
  const output = fs.createWriteStream(zipPath);
  const archive = archiver('zip', { zlib: { level: 5 } });

  archive.pipe(output);

  const orgDir = path.join(config.storagePath, org.storagePath);

  for (const doc of documents) {
    const srcPath = path.join(orgDir, doc.filePath);
    if (!fs.existsSync(srcPath)) continue;

    // Determine folder path
    let zipEntryPath;
    if (doc.documentFolders.length > 0) {
      const folderPath = getFolderPath(doc.documentFolders[0].folder.id);
      zipEntryPath = folderPath ? `${folderPath}/${doc.originalName}` : doc.originalName;
    } else {
      zipEntryPath = doc.originalName;
    }

    archive.file(srcPath, { name: zipEntryPath });
  }

  // Add empty folders
  for (const folder of allFolders) {
    const folderPath = getFolderPath(folder.id);
    if (folderPath) {
      archive.append('', { name: `${folderPath}/` });
    }
  }

  await archive.finalize();

  await new Promise((resolve, reject) => {
    output.on('close', resolve);
    output.on('error', reject);
  });

  const stats = fs.statSync(zipPath);

  await prisma.orgExport.update({
    where: { id: jobId },
    data: {
      status: 'ready',
      filePath: `exports/${zipFilename}`,
      fileSize: stats.size,
    },
  });
}

async function listExports({ organizationId }) {
  return prisma.orgExport.findMany({
    where: { organizationId },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });
}

async function downloadExport({ id, organizationId }) {
  const job = await prisma.orgExport.findFirst({
    where: { id, organizationId, status: 'ready' },
  });
  if (!job) {
    const err = new Error('Export not found');
    err.status = 404;
    throw err;
  }
  if (job.expiresAt && new Date(job.expiresAt).getTime() < Date.now()) {
    const err = new Error('Export has expired');
    err.status = 410;
    throw err;
  }
  return path.join(config.storagePath, job.filePath);
}

// ponytail: cleanup expired zips
async function cleanupExpiredExports() {
  const expired = await prisma.orgExport.findMany({
    where: { expiresAt: { lt: new Date() } },
  });
  for (const job of expired) {
    if (job.filePath) {
      const absPath = path.join(config.storagePath, job.filePath);
      try { fs.unlinkSync(absPath); } catch { /* gone */ }
    }
    await prisma.orgExport.delete({ where: { id: job.id } });
  }
}

module.exports = { requestExport, listExports, downloadExport, cleanupExpiredExports };
