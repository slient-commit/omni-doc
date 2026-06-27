'use strict';

const fs = require('fs');
const path = require('path');
const unzipper = require('unzipper');
const crypto = require('crypto');
const prisma = require('../lib/prisma');
const config = require('../config');
const { resolveFolderId } = require('../lib/resolveId');

// ponytail: extracts zip into current folder, creates subfolders and documents
async function extractZip({ zipPath, parentFolderId, organizationId, createdById, isPrivate, allowEdit, allowDelete, allowMove, allowCopy }) {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { storagePath: true },
  });
  const orgDir = path.join(config.storagePath, org.storagePath);
  fs.mkdirSync(orgDir, { recursive: true });

  const resolvedParentId = await resolveFolderId(parentFolderId);
  const toBool = (v) => v === 'true' || v === true;
  const priv = toBool(isPrivate);
  const perms = {
    allowEdit: allowEdit !== undefined ? toBool(allowEdit) : true,
    allowDelete: allowDelete !== undefined ? toBool(allowDelete) : true,
    allowMove: allowMove !== undefined ? toBool(allowMove) : true,
    allowCopy: allowCopy !== undefined ? toBool(allowCopy) : true,
  };

  // Map of zip folder path -> DB folder id
  const folderMap = new Map();
  if (resolvedParentId) folderMap.set('', resolvedParentId);

  const directory = await unzipper.Open.file(zipPath);
  let filesCreated = 0;
  let foldersCreated = 0;

  // First pass: create folders
  for (const entry of directory.files) {
    if (entry.type !== 'Directory') continue;
    const folderPath = entry.path.replace(/\/$/, '');
    if (!folderPath) continue;

    const parts = folderPath.split('/');
    let currentParentId = resolvedParentId;

    for (let i = 0; i < parts.length; i++) {
      const partialPath = parts.slice(0, i + 1).join('/');
      if (folderMap.has(partialPath)) {
        currentParentId = folderMap.get(partialPath);
        continue;
      }

      const folder = await prisma.folder.create({
        data: {
          name: parts[i],
          parentId: currentParentId,
          organizationId,
          createdById,
          isPrivate: priv,
          ...perms,
        },
      });
      folderMap.set(partialPath, folder.id);
      currentParentId = folder.id;
      foldersCreated++;
    }
  }

  // Second pass: create files
  for (const entry of directory.files) {
    if (entry.type === 'Directory') continue;
    const filePath = entry.path;
    if (!filePath || filePath.endsWith('/')) continue;

    const fileName = path.basename(filePath);
    const dirPath = path.dirname(filePath);
    const ext = path.extname(fileName);
    const storedFilename = `${crypto.randomUUID()}${ext}`;
    const destPath = path.join(orgDir, storedFilename);

    // Ensure parent folder exists
    let targetFolderId = resolvedParentId;
    if (dirPath && dirPath !== '.') {
      if (!folderMap.has(dirPath)) {
        // Create missing folders
        const parts = dirPath.split('/');
        let currentParentId = resolvedParentId;
        for (let i = 0; i < parts.length; i++) {
          const partialPath = parts.slice(0, i + 1).join('/');
          if (folderMap.has(partialPath)) {
            currentParentId = folderMap.get(partialPath);
            continue;
          }
          const folder = await prisma.folder.create({
            data: { name: parts[i], parentId: currentParentId, organizationId, createdById, isPrivate: priv, ...perms },
          });
          folderMap.set(partialPath, folder.id);
          currentParentId = folder.id;
          foldersCreated++;
        }
      }
      targetFolderId = folderMap.get(dirPath);
    }

    // Extract file to disk
    await new Promise((resolve, reject) => {
      entry.stream()
        .pipe(fs.createWriteStream(destPath))
        .on('finish', resolve)
        .on('error', reject);
    });

    const stats = fs.statSync(destPath);

    // Detect mime type from extension
    const mimeMap = {
      '.pdf': 'application/pdf', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
      '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml',
      '.doc': 'application/msword', '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel', '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.ppt': 'application/vnd.ms-powerpoint', '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      '.txt': 'text/plain', '.csv': 'text/csv', '.html': 'text/html', '.json': 'application/json',
      '.mp4': 'video/mp4', '.webm': 'video/webm', '.mp3': 'audio/mpeg', '.wav': 'audio/wav',
      '.zip': 'application/zip',
    };

    const doc = await prisma.document.create({
      data: {
        originalName: fileName,
        storedFilename,
        filePath: storedFilename,
        mimeType: mimeMap[ext.toLowerCase()] || 'application/octet-stream',
        fileSize: stats.size,
        documentDate: new Date(),
        organizationId,
        createdById,
        isPrivate: priv,
        ...perms,
      },
    });

    if (targetFolderId) {
      await prisma.documentFolder.create({
        data: { documentId: doc.id, folderId: targetFolderId },
      });
    }

    filesCreated++;
  }

  // Cleanup the uploaded zip
  try { fs.unlinkSync(zipPath); } catch { /* ok */ }

  return { message: `Extracted ${filesCreated} files and ${foldersCreated} folders`, filesCreated, foldersCreated };
}

module.exports = { extractZip };
