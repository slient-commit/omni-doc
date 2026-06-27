'use strict';

const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');
const { generateToken } = require('../lib/token');
const { sendShareEmail } = require('../lib/email');
const config = require('../config');

// ponytail: resolve uuid to numeric id
async function resolveDocId(identifier) {
  if (!identifier) return null;
  const num = Number(identifier);
  if (Number.isInteger(num)) return num;
  const doc = await prisma.document.findUnique({ where: { uuid: identifier }, select: { id: true } });
  return doc?.id ?? null;
}

async function resolveFolderId(identifier) {
  if (!identifier) return null;
  const num = Number(identifier);
  if (Number.isInteger(num)) return num;
  const folder = await prisma.folder.findUnique({ where: { uuid: identifier }, select: { id: true } });
  return folder?.id ?? null;
}

// --- Document Invites ---

async function createDocumentInvite({ documentId, invitedUserId, permission, invitedById, organizationId }) {
  const resolvedDocId = await resolveDocId(documentId);
  if (!resolvedDocId) {
    const err = new Error('Document not found');
    err.status = 404;
    throw err;
  }

  const invitedUser = await prisma.user.findFirst({
    where: { id: invitedUserId, organizationId },
  });
  if (!invitedUser) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }

  const existing = await prisma.documentInvite.findFirst({
    where: { documentId: resolvedDocId, invitedUserId },
  });
  if (existing) {
    const err = new Error('User already has access');
    err.status = 409;
    throw err;
  }

  return prisma.documentInvite.create({
    data: { documentId: resolvedDocId, invitedUserId, permission, invitedById },
    include: {
      invitedUser: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
  });
}

async function deleteDocumentInvite({ inviteId, organizationId }) {
  const invite = await prisma.documentInvite.findFirst({
    where: { id: inviteId },
    include: { document: { select: { organizationId: true } } },
  });
  if (!invite || invite.document.organizationId !== organizationId) {
    const err = new Error('Invite not found');
    err.status = 404;
    throw err;
  }
  await prisma.documentInvite.delete({ where: { id: inviteId } });
  return { message: 'Invite removed' };
}

// --- Folder Invites ---

async function createFolderInvite({ folderId, invitedUserId, permission, invitedById, organizationId }) {
  const resolvedFolderId = await resolveFolderId(folderId);
  if (!resolvedFolderId) {
    const err = new Error('Folder not found');
    err.status = 404;
    throw err;
  }

  const invitedUser = await prisma.user.findFirst({
    where: { id: invitedUserId, organizationId },
  });
  if (!invitedUser) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }

  const existing = await prisma.folderInvite.findFirst({
    where: { folderId: resolvedFolderId, invitedUserId },
  });
  if (existing) {
    const err = new Error('User already has access');
    err.status = 409;
    throw err;
  }

  return prisma.folderInvite.create({
    data: { folderId: resolvedFolderId, invitedUserId, permission, invitedById },
    include: {
      invitedUser: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
  });
}

async function deleteFolderInvite({ inviteId, organizationId }) {
  const invite = await prisma.folderInvite.findFirst({
    where: { id: inviteId },
    include: { folder: { select: { organizationId: true } } },
  });
  if (!invite || invite.folder.organizationId !== organizationId) {
    const err = new Error('Invite not found');
    err.status = 404;
    throw err;
  }
  await prisma.folderInvite.delete({ where: { id: inviteId } });
  return { message: 'Invite removed' };
}

// --- Share Links ---

async function createShareLink({ documentId, folderId, password, expiresAt, createdById }) {
  const token = generateToken();
  const data = { token, createdById };

  if (documentId) {
    const resolved = await resolveDocId(documentId);
    if (!resolved) { const err = new Error('Document not found'); err.status = 404; throw err; }
    data.documentId = resolved;
  }
  if (folderId) {
    const resolved = await resolveFolderId(folderId);
    if (!resolved) { const err = new Error('Folder not found'); err.status = 404; throw err; }
    data.folderId = resolved;
  }

  if (expiresAt) data.expiresAt = new Date(expiresAt);
  if (password) data.password = await bcrypt.hash(password, 12);

  return prisma.shareLink.create({ data });
}

async function listShareLinks({ createdById }) {
  return prisma.shareLink.findMany({
    where: { createdById },
    orderBy: { createdAt: 'desc' },
    include: {
      document: { select: { id: true, uuid: true, originalName: true } },
      folder: { select: { id: true, uuid: true, name: true } },
    },
  });
}

async function deleteShareLink({ id, createdById }) {
  const link = await prisma.shareLink.findFirst({ where: { id, createdById } });
  if (!link) {
    const err = new Error('Share link not found');
    err.status = 404;
    throw err;
  }
  await prisma.shareLink.delete({ where: { id } });
  return { message: 'Share link deleted' };
}

async function accessShareLink({ token, password }) {
  const link = await prisma.shareLink.findUnique({
    where: { token },
    include: {
      document: {
        include: {
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          category: true,
        },
      },
      folder: {
        include: {
          createdBy: { select: { id: true, firstName: true, lastName: true } },
          children: { where: { deletedAt: null }, orderBy: { name: 'asc' } },
          documentFolders: {
            include: {
              document: {
                include: {
                  createdBy: { select: { id: true, firstName: true, lastName: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!link) {
    const err = new Error('Share link not found');
    err.status = 404;
    throw err;
  }

  if (link.expiresAt && new Date(link.expiresAt).getTime() < Date.now()) {
    const err = new Error('Share link has expired');
    err.status = 410;
    throw err;
  }

  if (link.password) {
    if (!password) return { passwordRequired: true };
    const valid = await bcrypt.compare(password, link.password);
    if (!valid) {
      const err = new Error('Invalid password');
      err.status = 401;
      throw err;
    }
  }

  if (link.document && !link.document.deletedAt) return { type: 'document', document: link.document };
  if (link.folder && !link.folder.deletedAt) return { type: 'folder', folder: link.folder };
  const err2 = new Error('Linked item has been deleted');
  err2.status = 410;
  throw err2;
}

// --- Email share (public, per-recipient links, not visible in app) ---
async function emailShare({ documentId, folderId, emails, expiresAt, createdById }) {
  const sender = await prisma.user.findUnique({
    where: { id: createdById },
    select: { firstName: true, lastName: true },
  });
  const senderName = sender ? `${sender.firstName} ${sender.lastName}` : 'Someone';

  let itemName = 'Shared item';
  let itemType = 'document';

  if (documentId) {
    const resolved = await resolveDocId(documentId);
    if (!resolved) { const err = new Error('Document not found'); err.status = 404; throw err; }
    const doc = await prisma.document.findUnique({ where: { id: resolved }, select: { originalName: true } });
    itemName = doc?.originalName || 'Document';
    itemType = 'document';

    // Create one link per email — each is unique, not listed in app
    const results = [];
    for (const email of emails) {
      const token = generateToken();
      const link = await prisma.shareLink.create({
        data: {
          token,
          documentId: resolved,
          createdById,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
        },
      });
      const shareUrl = `${config.appUrl}/shared/${token}`;
      sendShareEmail({ to: email, shareUrl, itemName, itemType, senderName, expiresAt });
      results.push({ email, token: link.token });
    }
    return { message: `Shared with ${results.length} recipient(s)`, results };
  }

  if (folderId) {
    const resolved = await resolveFolderId(folderId);
    if (!resolved) { const err = new Error('Folder not found'); err.status = 404; throw err; }
    const folder = await prisma.folder.findUnique({ where: { id: resolved }, select: { name: true } });
    itemName = folder?.name || 'Folder';
    itemType = 'folder';

    const results = [];
    for (const email of emails) {
      const token = generateToken();
      const link = await prisma.shareLink.create({
        data: {
          token,
          folderId: resolved,
          createdById,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
        },
      });
      const shareUrl = `${config.appUrl}/shared/${token}`;
      sendShareEmail({ to: email, shareUrl, itemName, itemType, senderName, expiresAt });
      results.push({ email, token: link.token });
    }
    return { message: `Shared with ${results.length} recipient(s)`, results };
  }

  const err = new Error('documentId or folderId required');
  err.status = 400;
  throw err;
}

module.exports = {
  createDocumentInvite, deleteDocumentInvite,
  createFolderInvite, deleteFolderInvite,
  createShareLink, listShareLinks, deleteShareLink, accessShareLink,
  emailShare,
};
