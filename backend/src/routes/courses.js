const { Router } = require('express');
const crypto = require('crypto');
const prisma = require('../db');
const { authenticate } = require('../middleware/auth');
const { cache, clearCache } = require('../middleware/cache');
const { validate } = require('../middleware/validate');
const { courseCreateSchema } = require('../validation');
const { logAudit } = require('../helpers');

const router = Router();

const CACHE_PATTERN = 'cache:/api/v1/courses*';

router.get('/', authenticate, cache(60), async (req, res) => {
  try {
    const { search } = req.query;
    const where = search
      ? { name: { contains: search, mode: 'insensitive' } }
      : {};
    const courses = await prisma.course.findMany({
      where,
      include: { faculty: { include: { department: true } }, lecturer: true },
      orderBy: { name: 'asc' },
    });
    res.json(courses);
  } catch (err) {
    console.error('Get courses error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const course = await prisma.course.findUnique({
      where: { id: req.params.id },
      include: { faculty: { include: { department: true } }, lecturer: true },
    });
    if (!course) return res.status(404).json({ message: 'Course not found.' });
    res.json(course);
  } catch (err) {
    console.error('Get course error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

router.post('/', authenticate, validate(courseCreateSchema), async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  try {
    const { name, year, facultyId, lecturerId, credits, roomId, maxStudents } = req.body;
    if (!name || !year || !facultyId || !lecturerId) {
      return res.status(400).json({ message: 'name, year, facultyId, and lecturerId are required.' });
    }

    const faculty = await prisma.faculty.findUnique({
      where: { id: facultyId },
      include: { department: true },
    });
    if (!faculty) return res.status(400).json({ message: 'Faculty not found.' });

    const id = crypto.randomUUID();
    const course = await prisma.course.create({
      data: {
        id, name, year,
        department: faculty.department.name,
        facultyId,
        lecturerId,
        credits: credits ?? 3,
        roomId: roomId ?? null,
        maxStudents: maxStudents ?? null,
      },
    });
    await clearCache(CACHE_PATTERN);
    await logAudit({ action: 'create_course', performedBy: req.user.email, performedById: req.user.id, targetType: 'course', targetId: course.id, details: `Created course ${name} (${year})` });
    res.status(201).json(course);
  } catch (err) {
    console.error('Create course error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

router.put('/:id', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  try {
    const data = { ...req.body };
    if (data.facultyId) {
      const faculty = await prisma.faculty.findUnique({
        where: { id: data.facultyId },
        include: { department: true },
      });
      if (faculty) data.department = faculty.department.name;
    }
    const course = await prisma.course.update({
      where: { id: req.params.id },
      data,
    });
    await clearCache(CACHE_PATTERN);
    await logAudit({ action: 'update_course', performedBy: req.user.email, performedById: req.user.id, targetType: 'course', targetId: req.params.id, details: `Updated course ${req.params.id}` });
    res.json(course);
  } catch (err) {
    console.error('Update course error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  try {
    const deleted = await prisma.course.delete({ where: { id: req.params.id } });
    await clearCache(CACHE_PATTERN);
    await logAudit({ action: 'delete_course', performedBy: req.user.email, performedById: req.user.id, targetType: 'course', targetId: req.params.id, details: `Deleted course ${deleted.name}` });
    res.json({ message: 'Course deleted.' });
  } catch (err) {
    console.error('Delete course error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

module.exports = router;
