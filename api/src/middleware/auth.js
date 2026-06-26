'use strict';

const jwt = require('jsonwebtoken');
const config = require('../config');
const prisma = require('../lib/prisma');

async function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: { message: 'Authentication required' } });
  }

  try {
    const token = header.slice(7);
    const decoded = jwt.verify(token, config.jwtSecret);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { role: true, organization: true },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: { message: 'Authentication required' } });
    }

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: { message: 'Invalid or expired token' } });
  }
}

module.exports = { authenticate };
