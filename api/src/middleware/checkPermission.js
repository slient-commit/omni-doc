'use strict';

const prisma = require('../lib/prisma');

// ponytail: one DB query per permission check, add req-level cache if profiler says so
function checkPermission(action, subject) {
  return async (req, res, next) => {
    try {
      const count = await prisma.rolePermission.count({
        where: {
          roleId: req.user.roleId,
          permission: { action, subject },
        },
      });

      if (count === 0) {
        return res.status(403).json({ error: { message: 'Insufficient permissions' } });
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = { checkPermission };
