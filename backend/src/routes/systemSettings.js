const { Router } = require('express');
const prisma = require('../db');
const { authenticate } = require('../middleware/auth');
const { logAudit } = require('../helpers');

const router = Router();

function isAdmin(req) {
  return req.user && req.user.role === 'admin';
}

const SETTINGS_KEY = 'system';

// GET /api/v1/system-settings
router.get('/', authenticate, async (req, res) => {
  try {
    let row = await prisma.systemSetting.findUnique({ where: { key: SETTINGS_KEY } });
    if (!row) {
      row = await prisma.systemSetting.create({
        data: { id: 'sys_settings', key: SETTINGS_KEY, value: {} },
      });
    }
    res.json(row.value);
  } catch (err) {
    console.error('Get settings error:', err);
    res.status(500).json({ message: 'Failed to fetch settings' });
  }
});

// PUT /api/v1/system-settings
router.put('/', authenticate, async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ message: 'Forbidden' });
  try {
    const row = await prisma.systemSetting.upsert({
      where: { key: SETTINGS_KEY },
      create: { id: 'sys_settings', key: SETTINGS_KEY, value: req.body },
      update: { value: req.body },
    });

    await logAudit({
      action: 'update_system_settings',
      performedBy: req.user.email,
      performedById: req.user.id,
      targetType: 'system',
      targetId: 'settings',
      details: 'Updated system settings',
    });

    res.json(row.value);
  } catch (err) {
    console.error('Update settings error:', err);
    res.status(500).json({ message: 'Failed to update settings' });
  }
});

module.exports = router;
