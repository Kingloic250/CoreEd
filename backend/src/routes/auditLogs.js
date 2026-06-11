const { Router } = require('express');
const prisma = require('../db');
const { authenticate } = require('../middleware/auth');
const { cache } = require('../middleware/cache');

const router = Router();

router.get('/', authenticate, cache(60), async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  try {
    const { search } = req.query;
    const where = search
      ? {
          OR: [
            { action: { contains: search, mode: 'insensitive' } },
            { performedBy: { contains: search, mode: 'insensitive' } },
            { targetType: { contains: search, mode: 'insensitive' } },
            { details: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};
    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
    });
    res.json(logs);
  } catch (err) {
    console.error('Get audit logs error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

module.exports = router;
