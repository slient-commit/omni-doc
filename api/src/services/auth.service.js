'use strict';

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');
const prisma = require('../lib/prisma');
const { generateToken, generateTokenExpiry } = require('../lib/token');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../lib/email');

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function register({ email, password, firstName, lastName, organizationName }) {
  const slug = `${slugify(organizationName)}-${generateToken(4)}`;

  const result = await prisma.$transaction(async (tx) => {
    // Create organization
    const organization = await tx.organization.create({
      data: {
        name: organizationName,
        slug,
        storagePath: `orgs/${slug}`,
      },
    });

    // Create Owner role (system, all permissions)
    const allPermissions = await tx.permission.findMany();
    const ownerRole = await tx.role.create({
      data: {
        name: 'Owner',
        description: 'Full access — cannot be modified',
        organizationId: organization.id,
        isSystem: true,
        rolePermissions: {
          create: allPermissions.map((p) => ({ permissionId: p.id })),
        },
      },
    });

    // Create default Member role (basic read permissions)
    const readPermissions = await tx.permission.findMany({
      where: { action: 'read' },
    });
    await tx.role.create({
      data: {
        name: 'Member',
        description: 'Basic read access',
        organizationId: organization.id,
        isDefault: true,
        rolePermissions: {
          create: readPermissions.map((p) => ({ permissionId: p.id })),
        },
      },
    });

    // Create user
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await tx.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        organizationId: organization.id,
        roleId: ownerRole.id,
      },
    });

    // Create email verification token
    const token = generateToken();
    await tx.emailVerificationToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt: generateTokenExpiry(24),
      },
    });

    return { user, organization, verificationToken: token };
  });

  // Send verification email (fire-and-forget)
  sendVerificationEmail(result.user.email, result.verificationToken);

  return {
    user: {
      id: result.user.id,
      email: result.user.email,
      firstName: result.user.firstName,
      lastName: result.user.lastName,
    },
    organization: {
      id: result.organization.id,
      name: result.organization.name,
      slug: result.organization.slug,
    },
  };
}

async function login({ email, password }) {
  const user = await prisma.user.findFirst({
    where: { email },
    include: { role: true },
  });

  if (!user) {
    const err = new Error('Invalid email or password');
    err.status = 401;
    throw err;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    const err = new Error('Invalid email or password');
    err.status = 401;
    throw err;
  }

  if (!user.emailVerifiedAt) {
    const err = new Error('Please verify your email before signing in');
    err.status = 403;
    throw err;
  }

  if (!user.isActive) {
    const err = new Error('Account is deactivated');
    err.status = 403;
    throw err;
  }

  const token = jwt.sign(
    { userId: user.id, organizationId: user.organizationId },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn },
  );

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role.name,
    },
  };
}

async function verifyEmail({ token }) {
  const record = await prisma.emailVerificationToken.findUnique({
    where: { token },
  });

  if (!record || record.usedAt || record.expiresAt < new Date()) {
    const err = new Error('Invalid or expired verification token');
    err.status = 400;
    throw err;
  }

  await prisma.$transaction([
    prisma.emailVerificationToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
    prisma.user.update({
      where: { id: record.userId },
      data: { emailVerifiedAt: new Date() },
    }),
  ]);

  return { message: 'Email verified successfully' };
}

async function forgotPassword({ email }) {
  const user = await prisma.user.findFirst({ where: { email } });

  if (user) {
    const token = generateToken();
    await prisma.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt: generateTokenExpiry(1),
      },
    });
    sendPasswordResetEmail(user.email, token);
  }

  // Always return success to avoid leaking whether email exists
  return { message: 'If that email exists, a reset link has been sent' };
}

async function resetPassword({ token, newPassword }) {
  const record = await prisma.passwordResetToken.findUnique({
    where: { token },
  });

  if (!record || record.usedAt || record.expiresAt < new Date()) {
    const err = new Error('Invalid or expired reset token');
    err.status = 400;
    throw err;
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);

  await prisma.$transaction([
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash },
    }),
  ]);

  return { message: 'Password reset successfully' };
}

module.exports = { register, login, verifyEmail, forgotPassword, resetPassword };
