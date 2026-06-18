const { Router } = require('express');
const crypto = require('crypto');
const prisma = require('../db');
const { authenticate } = require('../middleware/auth');
const { cache, clearCache } = require('../middleware/cache');
const { validate } = require('../middleware/validate');
const { semesterCreateSchema } = require('../validation');
const { logAudit } = require('../helpers');

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
    const { name, year, startDate, endDate, registrationOpenDate, registrationCloseDate, dropDeadline, withdrawDeadline, maxCreditsPerStudent } = req.body;
    if (!name || !year || !startDate || !endDate) {
      return res.status(400).json({ message: 'name, year, startDate, and endDate are required.' });
    }
    const id = crypto.randomUUID();
    const semester = await prisma.semester.create({
      data: {
        id, name, year, startDate, endDate,
        registrationOpenDate: registrationOpenDate ?? null,
        registrationCloseDate: registrationCloseDate ?? null,
        dropDeadline: dropDeadline ?? null,
        withdrawDeadline: withdrawDeadline ?? null,
        maxCreditsPerStudent: maxCreditsPerStudent ?? 21,
      },
    });
    await clearCache(CACHE_PATTERN);
    await logAudit({ action: 'create_semester', performedBy: req.user.email, performedById: req.user.id, targetType: 'semester', targetId: semester.id, details: `Created semester ${name} ${year}` });
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
    await logAudit({ action: 'update_semester', performedBy: req.user.email, performedById: req.user.id, targetType: 'semester', targetId: req.params.id, details: `Updated semester ${req.params.id}` });
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
    await logAudit({ action: 'set_active_semester', performedBy: req.user.email, performedById: req.user.id, targetType: 'semester', targetId: req.params.id, details: `Activated semester ${req.params.id}` });
    res.json({ message: 'Active semester updated.' });
  } catch (err) {
    console.error('Activate semester error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  try {
    const deleted = await prisma.semester.delete({ where: { id: req.params.id } });
    await clearCache(CACHE_PATTERN);
    await logAudit({ action: 'delete_semester', performedBy: req.user.email, performedById: req.user.id, targetType: 'semester', targetId: req.params.id, details: `Deleted semester ${deleted.name} ${deleted.year}` });
    res.json({ message: 'Semester deleted.' });
  } catch (err) {
    console.error('Delete semester error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

module.exports = router;
