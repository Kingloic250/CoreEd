const { Router } = require('express');
const crypto = require('crypto');
const prisma = require('../db');
const { authenticate } = require('../middleware/auth');
const { cache, clearCache } = require('../middleware/cache');
const { validate } = require('../middleware/validate');
const { semesterCreateSchema } = require('../validation');

const router = Router();

const CACHE_PATTERN = 'cache:/api/v1/semesters';

router.get('/', authenticate, cache(120), async (req, res) => {
  try {
    const semesters = await prisma.semester.findMany({ orderBy: { year: 'desc' } });
    res.json(semesters);
  } catch (err) {
    console.error('Get semesters error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

router.post('/', authenticate, validate(semesterCreateSchema), async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  try {
    const { name, year, startDate, endDate } = req.body;
    if (!name || !year || !startDate || !endDate) {
      return res.status(400).json({ message: 'name, year, startDate, and endDate are required.' });
    }
    const id = crypto.randomUUID();
    const semester = await prisma.semester.create({ data: { id, name, year, startDate, endDate } });
    await clearCache(CACHE_PATTERN);
    res.status(201).json(semester);
  } catch (err) {
    console.error('Create semester error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

router.put('/:id', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  try {
    const semester = await prisma.semester.update({
      where: { id: req.params.id },
      data: req.body,
    });
    await clearCache(CACHE_PATTERN);
    res.json(semester);
  } catch (err) {
    console.error('Update semester error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

router.put('/:id/activate', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  try {
    await prisma.semester.updateMany({ where: { isActive: 1 }, data: { isActive: 0 } });
    await prisma.semester.update({ where: { id: req.params.id }, data: { isActive: 1 } });
    await clearCache(CACHE_PATTERN);
    res.json({ message: 'Active semester updated.' });
  } catch (err) {
    console.error('Activate semester error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  try {
    await prisma.semester.delete({ where: { id: req.params.id } });
    await clearCache(CACHE_PATTERN);
    res.json({ message: 'Semester deleted.' });
  } catch (err) {
    console.error('Delete semester error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

module.exports = router;
