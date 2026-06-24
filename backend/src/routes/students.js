const { Router } = require('express');
const crypto = require('crypto');
const prisma = require('../db');
const { authenticate } = require('../middleware/auth');
const { cache, clearCache } = require('../middleware/cache');
const { validate } = require('../middleware/validate');
const { studentCreateSchema, studentUpdateSchema } = require('../validation');
const { logAudit } = require('../helpers');

const router = Router();

const CACHE_PATTERN = 'cache:/api/v1/students*';

function generateStudentNumber(year) {
  const yearSuffix = String(year).slice(-2);
  const rand = () => String(Math.floor(Math.random() * 900) + 100);
  return `${yearSuffix}${rand()}`;
}

async function generateUniqueStudentNumber() {
  const year = new Date().getFullYear();
  for (let i = 0; i < 50; i++) {
    const sn = generateStudentNumber(year);
    const existing = await prisma.student.findUnique({ where: { studentNumber: sn } });
    if (!existing) return sn;
  }
  throw new Error('Could not generate unique student number');
}

router.get('/profile', authenticate, async (req, res) => {
  try {
    const student = await prisma.student.findUnique({
      where: { id: req.user.id },
      include: { faculty: true },
    });
    if (!student) return res.status(404).json({ message: 'Student not found.' });
    res.json(student);
  } catch (err) {
    console.error('Get current student error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const student = await prisma.student.findUnique({
      where: { id: req.params.id },
      include: { faculty: true },
    });
    if (!student) return res.status(404).json({ message: 'Student not found.' });
    res.json(student);
  } catch (err) {
    console.error('Get student error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

router.get('/', authenticate, cache(60), async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  const { search } = req.query;
  const where = search
    ? {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { studentNumber: { contains: search, mode: 'insensitive' } },
        ],
      }
    : {};
  const students = await prisma.student.findMany({
    where,
    include: { faculty: true },
    orderBy: { firstName: 'asc' },
  });
  res.json(students);
});

router.post('/', authenticate, validate(studentCreateSchema), async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  try {
    const { firstName, lastName, email, dateOfBirth, gender, year, facultyId, maxCredits } = req.body;
    const existing = await prisma.student.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ message: 'A student with this email already exists.' });

    const faculty = await prisma.faculty.findUnique({
      where: { id: facultyId },
      include: { department: true },
    });
    if (!faculty) return res.status(400).json({ message: 'Faculty not found.' });

    const id = crypto.randomUUID();
    const studentNumber = await generateUniqueStudentNumber();
    const student = await prisma.student.create({
      data: {
        id,
        firstName,
        lastName,
        email,
        dateOfBirth,
        gender,
        year,
        department: faculty.department.name,
        facultyId,
        enrollmentDate: new Date().toISOString().split('T')[0],
        status: 'active',
        studentNumber,
        maxCredits: maxCredits ?? null,
      },
    });
    await clearCache(CACHE_PATTERN);
    await logAudit({ action: 'create_student', performedBy: req.user.email, performedById: req.user.id, targetType: 'student', targetId: student.id, details: `Created student ${firstName} ${lastName} (${studentNumber})` });
    res.status(201).json(student);
  } catch (err) {
    console.error('Create student error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

router.put('/:id', authenticate, validate(studentUpdateSchema), async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  try {
    const data = { ...req.body };
    if (data.facultyId) {
      const faculty = await prisma.faculty.findUnique({
        where: { id: data.facultyId },
        include: { department: true },
      });
      if (faculty) data.department = faculty.department.name;
    } else if (data.facultyId === null || data.facultyId === '') {
      data.department = null;
    }
    const student = await prisma.student.update({
      where: { id: req.params.id },
      data,
    });
    await clearCache(CACHE_PATTERN);
    await logAudit({ action: 'update_student', performedBy: req.user.email, performedById: req.user.id, targetType: 'student', targetId: req.params.id, details: `Updated student ${req.params.id}` });
    res.json(student);
  } catch (err) {
    console.error('Update student error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  try {
    const deleted = await prisma.student.delete({ where: { id: req.params.id } });
    await clearCache(CACHE_PATTERN);
    await logAudit({ action: 'delete_student', performedBy: req.user.email, performedById: req.user.id, targetType: 'student', targetId: req.params.id, details: `Deleted student ${deleted.firstName} ${deleted.lastName}` });
    res.json({ message: 'Student deleted.' });
  } catch (err) {
    console.error('Delete student error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

module.exports = router;
