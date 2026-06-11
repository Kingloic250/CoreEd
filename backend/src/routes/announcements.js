const { Router } = require('express');
const crypto = require('crypto');
const prisma = require('../db');
const { authenticate } = require('../middleware/auth');
const { cache, clearCache } = require('../middleware/cache');
const { logAudit } = require('../helpers');

const router = Router();

const CACHE_PATTERN = 'cache:/api/v1/announcements*';

router.get('/', authenticate, cache(60), async (req, res) => {
  try {
    const { role } = req.query;
    const where = role
      ? { targetRoles: { array_contains: role } }
      : {};
    const announcements = await prisma.announcement.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    res.json(announcements);
  } catch (err) {
    console.error('Get announcements error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

router.post('/', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  try {
    const { title, body, targetRoles, priority } = req.body;
    if (!title || !body || !Array.isArray(targetRoles) || targetRoles.length === 0) {
      return res.status(400).json({ message: 'title, body, and targetRoles are required.' });
    }

    const id = crypto.randomUUID();
    const announcement = await prisma.announcement.create({
      data: { id, title, body, targetRoles, priority: priority ?? 'normal', createdBy: req.user.email },
    });
    await clearCache(CACHE_PATTERN);
    await logAudit({ action: 'create_announcement', performedBy: req.user.email, performedById: req.user.id, targetType: 'announcement', targetId: announcement.id, details: `Created announcement: ${title}` });
    res.status(201).json(announcement);
  } catch (err) {
    console.error('Create announcement error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

module.exports = router;