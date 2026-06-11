const { Router } = require('express');
const crypto = require('crypto');
const prisma = require('../db');
const { authenticate } = require('../middleware/auth');
const { cache, clearCache } = require('../middleware/cache');
const { validate } = require('../middleware/validate');
const { departmentCreateSchema } = require('../validation');
const { logAudit } = require('../helpers');

const router = Router();

const CACHE_PATTERN = 'cache:/api/v1/departments';

router.get('/', authenticate, cache(300), async (req, res) => {
  const departments = await prisma.department.findMany({ orderBy: { name: 'asc' } });
  res.json(departments);
});

router.post('/', authenticate, validate(departmentCreateSchema), async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  try {
    const { name, code, headLecturerId, description } = req.body;
    if (!name) return res.status(400).json({ message: 'Department name is required.' });
    const id = crypto.randomUUID();
    const dept = await prisma.department.create({
      data: { id, name, code: code ?? null, headLecturerId: headLecturerId ?? null, description: description ?? null },
    });
    await clearCache(CACHE_PATTERN);
    await logAudit({ action: 'create_department', performedBy: req.user.email, performedById: req.user.id, targetType: 'department', targetId: dept.id, details: `Created department ${name}` });
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
    await logAudit({ action: 'update_department', performedBy: req.user.email, performedById: req.user.id, targetType: 'department', targetId: req.params.id, details: `Updated department ${req.params.id}` });
    res.json(dept);
  } catch (err) {
    res.status(500).json({ message: 'Internal server error.' });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  try {
    const deleted = await prisma.department.delete({ where: { id: req.params.id } });
    await clearCache(CACHE_PATTERN);
    await logAudit({ action: 'delete_department', performedBy: req.user.email, performedById: req.user.id, targetType: 'department', targetId: req.params.id, details: `Deleted department ${deleted.name}` });
    res.json({ message: 'Department deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Internal server error.' });
  }
});

module.exports = router;
