'use strict';

const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const prisma = require('../lib/prisma');
const { generateToken, generateTokenExpiry } = require('../lib/token');
const { sendInviteEmail } = require('../lib/email');

async function list({ organizationId }) {
  return prisma.user.findMany({
    where: { organizationId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      isActive: true,
      emailVerifiedAt: true,
      createdAt: true,
      role: { select: { id: true, name: true } },
    },
  });
}

async function invite({ email, firstName, lastName, roleId, organizationId, invitedById }) {
  const existing = await prisma.user.findFirst({ where: { email } });
  if (existing) {
    const err = new Error('A user with this email already exists');
    err.status = 409;
    throw err;
  }

  if (roleId) {
    const role = await prisma.role.findFirst({
      where: { id: roleId, organizationId },
    });
    if (!role) {
      const err = new Error('Role not found');
      err.status = 404;
      throw err;
    }
  } else {
    // Use default role
    const defaultRole = await prisma.role.findFirst({
      where: { organizationId, isDefault: true },
    });
    if (defaultRole) {
      roleId = defaultRole.id;
    }
  }

  const randomPassword = crypto.randomBytes(16).toString('hex');
  const passwordHash = await bcrypt.hash(randomPassword, 12);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      firstName,
      lastName,
      organizationId,
      roleId,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      isActive: true,
      createdAt: true,
      role: { select: { id: true, name: true } },
    },
  });

  // Create email verification token
  const token = generateToken();
  await prisma.emailVerificationToken.create({
    data: {
      token,
      userId: user.id,
      expiresAt: generateTokenExpiry(24),
    },
  });

  // Get inviter and org names for the email
  const inviter = await prisma.user.findUnique({ where: { id: invitedById }, select: { firstName: true, lastName: true } });
  const org = await prisma.organization.findUnique({ where: { id: organizationId }, select: { name: true } });
  const inviterName = inviter ? `${inviter.firstName} ${inviter.lastName}` : 'Your team';
  const orgName = org?.name || 'your organization';

  sendInviteEmail(email, token, inviterName, orgName);

  return user;
}

async function update({ id, firstName, lastName, roleId, isActive, organizationId }) {
  const user = await prisma.user.findFirst({
    where: { id, organizationId },
    include: { role: true },
  });
  if (!user) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }

  // Cannot change the role of a system-role user
  if (roleId !== undefined && user.role.isSystem && roleId !== user.roleId) {
    const err = new Error('Cannot change the role of a system role user');
    err.status = 403;
    throw err;
  }

  const data = {};
  if (firstName !== undefined) data.firstName = firstName;
  if (lastName !== undefined) data.lastName = lastName;
  if (roleId !== undefined) data.roleId = roleId;
  if (isActive !== undefined) data.isActive = isActive;

  return prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      isActive: true,
      createdAt: true,
      role: { select: { id: true, name: true } },
    },
  });
}

async function deactivate({ id, organizationId }) {
  const user = await prisma.user.findFirst({
    where: { id, organizationId },
  });
  if (!user) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }

  await prisma.user.update({
    where: { id },
    data: { isActive: false },
  });

  return { message: 'User deactivated' };
}

module.exports = { list, invite, update, deactivate };
