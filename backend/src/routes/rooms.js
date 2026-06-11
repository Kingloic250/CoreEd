const { Router } = require('express');
const crypto = require('crypto');
const prisma = require('../db');
const { authenticate } = require('../middleware/auth');
const { logAudit } = require('../helpers');

const router = Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const rooms = await prisma.room.findMany({ orderBy: { name: 'asc' } });
    res.json(rooms);
  } catch (err) {
    console.error('Get rooms error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

router.post('/', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  try {
    const { name, code, capacity, building, description } = req.body;
    if (!name) return res.status(400).json({ message: 'Room name is required.' });

    const id = crypto.randomUUID();
    const room = await prisma.room.create({
      data: { id, name, code: code ?? null, capacity: capacity ?? 0, building: building ?? null, description: description ?? null },
    });
    await logAudit({ action: 'create_room', performedBy: req.user.email, performedById: req.user.id, targetType: 'room', targetId: room.id, details: `Created room ${name}` });
    res.status(201).json(room);
  } catch (err) {
    console.error('Create room error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

router.put('/:id', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  try {
    const room = await prisma.room.update({ where: { id: req.params.id }, data: req.body });
    await logAudit({ action: 'update_room', performedBy: req.user.email, performedById: req.user.id, targetType: 'room', targetId: req.params.id, details: `Updated room ${req.params.id}` });
    res.json(room);
  } catch (err) {
    console.error('Update room error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  try {
    const deleted = await prisma.room.delete({ where: { id: req.params.id } });
    await logAudit({ action: 'delete_room', performedBy: req.user.email, performedById: req.user.id, targetType: 'room', targetId: req.params.id, details: `Deleted room ${deleted.name}` });
    res.json({ message: 'Room deleted.' });
  } catch (err) {
    console.error('Delete room error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

module.exports = router;