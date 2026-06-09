const { Router } = require('express');
const crypto = require('crypto');
const prisma = require('../db');
const { authenticate } = require('../middleware/auth');
const { cache, clearCache } = require('../middleware/cache');

const router = Router();

const CACHE_PATTERN = 'cache:/api/v1/departments';

router.get('/', authenticate, cache(300), async (req, res) => {
  const departments = await prisma.department.findMany({ orderBy: { name: 'asc' } });
  res.json(departments);
});

router.post('/', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  try {
    const { name, code, headLecturerId, description } = req.body;
    if (!name) return res.status(400).json({ message: 'Department name is required.' });
    const id = crypto.randomUUID();
    const dept = await prisma.department.create({
      data: { id, name, code: code ?? null, headLecturerId: headLecturerId ?? null, description: description ?? null },
    });
    await clearCache(CACHE_PATTERN);
    res.status(201).json(dept);
  } catch (err) {
    console.error('Create department error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

router.put('/:id', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  try {
    const dept = await prisma.department.update({
      where: { id: req.params.id },
      data: req.body,
    });
    await clearCache(CACHE_PATTERN);
    res.json(dept);
  } catch (err) {
    res.status(500).json({ message: 'Internal server error.' });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  try {
    await prisma.department.delete({ where: { id: req.params.id } });
    await clearCache(CACHE_PATTERN);
    res.json({ message: 'Department deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Internal server error.' });
  }
});

module.exports = router;
