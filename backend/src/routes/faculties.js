const { Router } = require('express');
const crypto = require('crypto');
const prisma = require('../db');
const { authenticate } = require('../middleware/auth');
const { cache, clearCache } = require('../middleware/cache');
const { validate } = require('../middleware/validate');
const { facultyCreateSchema } = require('../validation');

const router = Router();

const CACHE_PATTERN = 'cache:/api/v1/faculties*';

router.get('/', authenticate, cache(300), async (req, res) => {
  const { departmentId } = req.query;
  const where = departmentId ? { departmentId } : {};
  const faculties = await prisma.faculty.findMany({
    where,
    include: { department: true },
    orderBy: { name: 'asc' },
  });
  res.json(faculties);
});

router.post('/', authenticate, validate(facultyCreateSchema), async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  try {
    const { name, code, departmentId, description } = req.body;
    if (!name || !departmentId) return res.status(400).json({ message: 'Name and department are required.' });
    const id = crypto.randomUUID();
    const faculty = await prisma.faculty.create({
      data: { id, name, code: code ?? null, departmentId, description: description ?? null },
    });
    await clearCache(CACHE_PATTERN);
    res.status(201).json(faculty);
  } catch (err) {
    console.error('Create faculty error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

router.put('/:id', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  try {
    const faculty = await prisma.faculty.update({
      where: { id: req.params.id },
      data: req.body,
    });
    await clearCache(CACHE_PATTERN);
    res.json(faculty);
  } catch (err) {
    res.status(500).json({ message: 'Internal server error.' });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  try {
    await prisma.faculty.delete({ where: { id: req.params.id } });
    await clearCache(CACHE_PATTERN);
    res.json({ message: 'Faculty deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Internal server error.' });
  }
});

module.exports = router;
