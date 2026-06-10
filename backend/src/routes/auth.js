const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const prisma = require('../db');
const { redis } = require('../redis');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { loginSchema } = require('../validation');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

router.post('/login', validate(loginSchema), async (req, res) => {
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

router.post('/change-password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password are required.' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters.' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      return res.status(401).json({ message: 'Current password is incorrect.' });
    }

    const hash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: req.user.id }, data: { password: hash } });
    res.json({ message: 'Password changed successfully.' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

router.post('/setup-account', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ message: 'Token and password are required.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    }

    const lecturer = await prisma.lecturer.findUnique({ where: { invitationToken: token } });
    if (!lecturer) {
      return res.status(400).json({ message: 'Invalid or expired invitation link.' });
    }
    if (lecturer.invitationAcceptedAt) {
      return res.status(400).json({ message: 'This invitation has already been used.' });
    }
    if (lecturer.invitationTokenExpires && new Date() > lecturer.invitationTokenExpires) {
      return res.status(400).json({ message: 'This invitation has expired. Contact your administrator.' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email: lecturer.email } });
    if (existingUser) {
      return res.status(409).json({ message: 'A user account with this email already exists.' });
    }

    const hash = await bcrypt.hash(password, 10);
    const userId = crypto.randomUUID();

    await prisma.$transaction([
      prisma.user.create({
        data: { id: userId, email: lecturer.email, name: `${lecturer.firstName} ${lecturer.lastName}`, password: hash, role: 'lecturer', emailVerified: true },
      }),
      prisma.lecturer.update({
        where: { id: lecturer.id },
        data: { invitationToken: null, invitationTokenExpires: null, invitationAcceptedAt: new Date() },
      }),
    ]);

    res.json({ message: 'Account activated successfully. You can now log in.' });
  } catch (err) {
    console.error('Setup account error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

module.exports = router;
