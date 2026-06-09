const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const prisma = require('../db');
const { redis } = require('../redis');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const verified = user.emailVerified;
    const jti = crypto.randomUUID();

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role, verified, jti },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar, verified },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

router.post('/logout', authenticate, async (req, res) => {
  try {
    const { jti, exp } = req.user;
    if (jti && exp) {
      const ttl = Math.max(0, exp - Math.floor(Date.now() / 1000));
      if (ttl > 0) {
        await redis.set(`blacklist:${jti}`, '1', 'EX', ttl);
      }
    }
    res.json({ message: 'Logged out successfully.' });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

module.exports = router;
