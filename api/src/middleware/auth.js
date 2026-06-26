'use strict';

const jwt = require('jsonwebtoken');
const config = require('../config');
const prisma = require('../lib/prisma');

async function authenticate(req, res, next) {
  const header = req.headers.authorization;
  // ponytail: also accept ?token= for iframe/img loads that can't send headers
  const queryToken = req.query.token;
  const bearerToken = header?.startsWith('Bearer ') ? header.slice(7) : null;
  const token = bearerToken || queryToken;

  if (!token) {
    return res.status(401).json({ error: { message: 'Authentication required' } });
  }

  try {
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
