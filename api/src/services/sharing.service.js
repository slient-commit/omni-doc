'use strict';

const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');
const { generateToken } = require('../lib/token');

// --- Document Invites ---

async function createDocumentInvite({ documentId, invitedUserId, permission, invitedById, organizationId }) {
  const document = await prisma.document.findFirst({
    where: { id: documentId, organizationId, deletedAt: null },
  });
  if (!document) {
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
    where: { documentId, invitedUserId },
  });
  if (existing) {
    const err = new Error('User already has access to this document');
    err.status = 409;
    throw err;
  }

  return prisma.documentInvite.create({
    data: { documentId, invitedUserId, permission, invitedById },
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
  const folder = await prisma.folder.findFirst({
    where: { id: folderId, organizationId, deletedAt: null },
  });
  if (!folder) {
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
    where: { folderId, invitedUserId },
  });
  if (existing) {
    const err = new Error('User already has access to this folder');
    err.status = 409;
    throw err;
  }

  return prisma.folderInvite.create({
    data: { folderId, invitedUserId, permission, invitedById },
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
  const data = {
    token,
    createdById,
    expiresAt: expiresAt ? new Date(expiresAt) : null,
  };

  if (documentId) data.documentId = documentId;
  if (folderId) data.folderId = folderId;

  if (password) {
    data.passwordHash = await bcrypt.hash(password, 12);
  }

  return prisma.shareLink.create({ data });
}

async function listShareLinks({ createdById }) {
  return prisma.shareLink.findMany({
    where: { createdById },
    orderBy: { createdAt: 'desc' },
    include: {
      document: { select: { id: true, originalName: true } },
      folder: { select: { id: true, name: true } },
    },
  });
}

async function deleteShareLink({ id, createdById }) {
  const link = await prisma.shareLink.findFirst({
    where: { id, createdById },
  });
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
                  category: true,
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

  if (link.passwordHash) {
    if (!password) {
      const err = new Error('Password required');
      err.status = 401;
      throw err;
    }
    const valid = await bcrypt.compare(password, link.passwordHash);
    if (!valid) {
      const err = new Error('Invalid password');
      err.status = 401;
      throw err;
    }
  }

  return {
    document: link.document || null,
    folder: link.folder || null,
  };
}

module.exports = {
  createDocumentInvite,
  deleteDocumentInvite,
  createFolderInvite,
  deleteFolderInvite,
  createShareLink,
  listShareLinks,
  deleteShareLink,
  accessShareLink,
};
