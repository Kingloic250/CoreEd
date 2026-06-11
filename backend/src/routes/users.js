const { Router } = require('express');
const bcrypt = require('bcryptjs');
const prisma = require('../db');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { userUpdateSchema } = require('../validation');
const { logAudit } = require('../helpers');

const router = Router();

const safeUser = (u) => {
  const { password, ...rest } = u;
  return rest;
};

router.get('/', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  try {
    const users = await prisma.user.findMany({ orderBy: { name: 'asc' } });
    res.json(users.map(safeUser));
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

router.put('/:id', authenticate, validate(userUpdateSchema), async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  try {
    const { name, email, role } = req.body;
    if (!name || !email || !role) {
      return res.status(400).json({ message: 'name, email, and role are required.' });
    }
    const existing = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ message: 'User not found.' });

    if (email !== existing.email) {
      const emailTaken = await prisma.user.findUnique({ where: { email } });
      if (emailTaken) return res.status(409).json({ message: 'Email already in use.' });
    }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { name, email, role },
    });
    await logAudit({ action: 'update_user', performedBy: req.user.email, performedById: req.user.id, targetType: 'user', targetId: req.params.id, details: `Updated user ${name} (${email})` });
    res.json(safeUser(user));
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ message: 'Cannot delete your own account.' });
    }
    const existing = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ message: 'User not found.' });

    await prisma.user.delete({ where: { id: req.params.id } });
    await logAudit({ action: 'delete_user', performedBy: req.user.email, performedById: req.user.id, targetType: 'user', targetId: req.params.id, details: `Deleted user ${existing.name} (${existing.email})` });
    res.json({ message: 'User deleted.' });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

module.exports = router;
