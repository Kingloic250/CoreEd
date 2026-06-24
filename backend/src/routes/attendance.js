const { Router } = require('express');
const crypto = require('crypto');
const prisma = require('../db');
const { authenticate } = require('../middleware/auth');

const router = Router();

async function invalidateAttendanceCache() {
  try {
    const { default: redisClient } = await import('../redis.js');
    if (redisClient?.isOpen) {
      const keys = await redisClient.keys('cache:attendance:*');
      if (keys.length) await redisClient.del(keys);
    }
  } catch { /* noop */ }
}

router.get('/', authenticate, async (req, res) => {
  try {
    const { courseId, date, studentId, markedBy } = req.query;
    const where = {};
    if (courseId) where.courseId = courseId;
    if (date) where.date = date;
    if (studentId) where.studentId = studentId;
    if (markedBy) where.markedBy = markedBy;

    const records = await prisma.attendance.findMany({
      where,
      orderBy: { date: 'desc' },
    });
    res.json(records);
  } catch (err) {
    console.error('Get attendance error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

router.get('/student/:studentId', authenticate, async (req, res) => {
  try {
    const { studentId } = req.params;
    const records = await prisma.attendance.findMany({
      where: { studentId },
      orderBy: { date: 'desc' },
    });
    res.json(records);
  } catch (err) {
    console.error('Get student attendance error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

router.post('/', authenticate, async (req, res) => {
  if (req.user.role !== 'lecturer' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  try {
    const { courseId, studentId, date, status, markedBy } = req.body;
    if (!courseId || !studentId || !date || !status) {
      return res.status(400).json({ message: 'courseId, studentId, date, and status are required.' });
    }

    const record = await prisma.attendance.create({
      data: {
        id: crypto.randomUUID(),
        courseId,
        studentId,
        date,
        status,
        markedBy: markedBy ?? req.user.id,
      },
    });
    await invalidateAttendanceCache();
    res.status(201).json(record);
  } catch (err) {
    console.error('Log attendance error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

router.post('/mark', authenticate, async (req, res) => {
  if (req.user.role !== 'lecturer' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  try {
    const { courseId, date, entries, markedBy } = req.body;
    if (!courseId || !date || !entries || !Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({ message: 'courseId, date, and entries array are required.' });
    }

    const data = entries.map((e) => ({
      id: crypto.randomUUID(),
      courseId,
      studentId: e.studentId,
      date,
      status: e.status,
      markedBy: markedBy ?? req.user.id,
    }));

    await prisma.attendance.createMany({ data });
    await invalidateAttendanceCache();
    res.status(201).json({ message: `Attendance marked for ${data.length} students.`, count: data.length });
  } catch (err) {
    console.error('Mark attendance error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

router.put('/:id', authenticate, async (req, res) => {
  if (req.user.role !== 'lecturer' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ message: 'status is required.' });

    const existing = await prisma.attendance.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ message: 'Attendance record not found.' });

    const updated = await prisma.attendance.update({
      where: { id: req.params.id },
      data: { status },
    });
    await invalidateAttendanceCache();
    res.json(updated);
  } catch (err) {
    console.error('Update attendance error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

module.exports = router;
