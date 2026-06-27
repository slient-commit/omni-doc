'use strict';

const prisma = require('./prisma');

// ponytail: single resolver for uuid/id, replaces 6 duplicate functions across services
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

function idOrUuidDoc(identifier) {
  const num = Number(identifier);
  return Number.isInteger(num) ? { id: num } : { uuid: identifier };
}

function idOrUuidFolder(identifier) {
  const num = Number(identifier);
  return Number.isInteger(num) ? { id: num } : { uuid: identifier };
}

module.exports = { resolveDocId, resolveFolderId, idOrUuidDoc, idOrUuidFolder };
