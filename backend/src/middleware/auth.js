const jwt = require('jsonwebtoken');
const { redis } = require('../redis');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production';

async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const blacklisted = await redis.get(`blacklist:${decoded.jti}`);
    if (blacklisted) {
      return res.status(401).json({ message: 'Token has been revoked.' });
    }
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
    }
    next();
  };
}

module.exports = { authenticate, requireRole };
