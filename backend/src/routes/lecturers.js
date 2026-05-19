const { Router } = require('express');
const crypto = require('crypto');
const prisma = require('../db');
const { authenticate } = require('../middleware/auth');

const router = Router();

router.get('/', authenticate, async (req, res) => {
  const lecturers = await prisma.lecturer.findMany({ orderBy: { firstName: 'asc' } });
  res.json(lecturers);
});

router.post('/', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  try {
    const { firstName, lastName, email, department, qualification, joinDate } = req.body;
    if (!firstName || !lastName || !email) return res.status(400).json({ message: 'firstName, lastName, and email are required.' });
    const existing = await prisma.lecturer.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ message: 'A lecturer with this email already exists.' });
    const id = crypto.randomUUID();
    const lecturer = await prisma.lecturer.create({
      data: { id, firstName, lastName, email, department: department ?? null, assignedCourses: [], qualification: qualification ?? null, joinDate: joinDate ?? null },
    });
    res.status(201).json(lecturer);
  } catch (err) {
    console.error('Create lecturer error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

router.put('/:id', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  try {
    const lecturer = await prisma.lecturer.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(lecturer);
  } catch (err) {
    res.status(500).json({ message: 'Internal server error.' });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  try {
    await prisma.lecturer.delete({ where: { id: req.params.id } });
    res.json({ message: 'Lecturer deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Internal server error.' });
  }
});

module.exports = router;
