'use strict';

const prisma = require('../lib/prisma');

function checkPermission(action, subject) {
  return async (req, res, next) => {
    try {
      // Cache permissions on the request to avoid repeated DB hits
      if (!req.user._permissions) {
        const rolePerms = await prisma.rolePermission.findMany({
          where: { roleId: req.user.roleId },
          include: { permission: true },
        });
        req.user._permissions = rolePerms.map((rp) => rp.permission);
      }

      const has = req.user._permissions.some(
        (p) => p.action === action && p.subject === subject,
      );

      if (!has) {
        return res.status(403).json({ error: { message: 'Insufficient permissions' } });
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = { checkPermission };
