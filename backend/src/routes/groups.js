const { Router } = require('express');
const crypto = require('crypto');
const prisma = require('../db');
const { authenticate } = require('../middleware/auth');
const { cache, clearCache } = require('../middleware/cache');
const { validate } = require('../middleware/validate');
const { groupCreateSchema } = require('../validation');
const { logAudit } = require('../helpers');

const router = Router();
const CACHE_PATTERN = 'cache:/api/v1/groups*';

router.get('/', authenticate, cache(60), async (req, res) => {
  try {
    const { courseId, semesterId, lecturerId } = req.query;
    const where = {};
    if (courseId) where.courseId = courseId;
    if (semesterId) where.semesterId = semesterId;
    if (lecturerId) where.lecturerId = lecturerId;

    const groups = await prisma.group.findMany({
      where,
      include: {
        course: { select: { id: true, name: true, credits: true } },
        lecturer: { select: { id: true, firstName: true, lastName: true } },
        room: { select: { id: true, name: true, code: true } },
        semester: { select: { id: true, name: true, year: true } },
      },
      orderBy: [{ courseId: 'asc' }, { name: 'asc' }],
    });

    const groupIds = groups.map((g) => g.id);
    const enrollmentCounts = await prisma.enrollment.groupBy({
      by: ['groupId'],
      where: { groupId: { in: groupIds }, status: { not: 'DROPPED' } },
      _count: { id: true },
    });
    const countMap = Object.fromEntries(enrollmentCounts.map((e) => [e.groupId, e._count.id]));

    // When filtering by courseId, also include enrolled student IDs from Enrollment table
    let enrollmentStudentMap = {};
    if (courseId) {
      const enrollments = await prisma.enrollment.findMany({
        where: { courseId, status: { not: 'DROPPED' } },
        select: { groupId: true, studentId: true },
      });
      for (const e of enrollments) {
        if (!enrollmentStudentMap[e.groupId]) enrollmentStudentMap[e.groupId] = [];
        enrollmentStudentMap[e.groupId].push(e.studentId);
      }
    }

    const result = groups.map((g) => ({
      ...g,
      enrolledCount: countMap[g.id] ?? 0,
      enrolledStudentIds: enrollmentStudentMap[g.id] ?? g.enrolledStudentIds ?? [],
    }));

    res.json(result);
  } catch (err) {
    console.error('Get groups error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const group = await prisma.group.findUnique({
      where: { id: req.params.id },
      include: {
        course: { select: { id: true, name: true, credits: true } },
        lecturer: { select: { id: true, firstName: true, lastName: true } },
        room: { select: { id: true, name: true, code: true } },
        semester: { select: { id: true, name: true, year: true } },
      },
    });
    if (!group) return res.status(404).json({ message: 'Group not found.' });
    const enrolledCount = await prisma.enrollment.count({
      where: { groupId: group.id, status: { not: 'DROPPED' } },
    });
    res.json({ ...group, enrolledCount });
  } catch (err) {
    console.error('Get group error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

router.post('/', authenticate, validate(groupCreateSchema), async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  try {
    const { name, courseId, semesterId, lecturerId, roomId, capacity, schedule } = req.body;

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) return res.status(400).json({ message: 'Course not found.' });

    const id = crypto.randomUUID();
    const group = await prisma.group.create({
      data: {
        id, name, courseId,
        semesterId: semesterId ?? null,
        lecturerId: lecturerId ?? null,
        roomId: roomId ?? null,
        capacity: capacity ?? 30,
        schedule: schedule ?? [],
      },
      include: {
        course: { select: { name: true } },
        lecturer: { select: { firstName: true, lastName: true } },
        room: { select: { name: true } },
      },
    });

    await clearCache(CACHE_PATTERN);
    await logAudit({ action: 'create_group', performedBy: req.user.email, performedById: req.user.id, targetType: 'group', targetId: id, details: `Created group ${name} for course ${course.name}` });
    res.status(201).json(group);
  } catch (err) {
    console.error('Create group error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// POST /api/v1/groups/bulk — bulk create groups for multiple courses
router.post('/bulk', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  try {
    const { entries } = req.body;
    if (!Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({ message: 'entries array is required.' });
    }

    const DAY_SCHEDULE = [0, 1, 2, 3, 4].map((day) => ({
      day, startTime: '08:00', endTime: '17:00',
    }));
    const NIGHT_SCHEDULE = [0, 1, 2, 3, 4].map((day) => ({
      day, startTime: '17:00', endTime: '21:00',
    }));
    const GROUP_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

    const created = [];
    const errors = [];

    for (const entry of entries) {
      const { courseId, groups } = entry;
      if (!courseId || !Array.isArray(groups) || groups.length === 0) {
        errors.push({ courseId, message: 'Invalid entry: courseId and groups[] required.' });
        continue;
      }

      const course = await prisma.course.findUnique({ where: { id: courseId } });
      if (!course) {
        errors.push({ courseId, message: 'Course not found.' });
        continue;
      }

      for (let i = 0; i < groups.length; i++) {
        const g = groups[i];
        const letter = GROUP_LETTERS[i] ?? String(i + 1);
        const name = `${course.name} - ${letter}`;
        const schedule = g.period === 'night' ? NIGHT_SCHEDULE : DAY_SCHEDULE;

        const id = crypto.randomUUID();
        const group = await prisma.group.create({
          data: {
            id, name, courseId,
            semesterId: null,
            lecturerId: null,
            roomId: null,
            capacity: 30,
            schedule,
          },
        });
        created.push(group);
      }
    }

    await clearCache(CACHE_PATTERN);
    await logAudit({ action: 'bulk_create_groups', performedBy: req.user.email, performedById: req.user.id, targetType: 'group', targetId: 'bulk', details: `Created ${created.length} groups across ${entries.length} course(s)` });
    res.status(201).json({ created, errors: errors.length > 0 ? errors : undefined, total: created.length });
  } catch (err) {
    console.error('Bulk create groups error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

router.put('/:id', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  try {
    const existing = await prisma.group.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ message: 'Group not found.' });

    const group = await prisma.group.update({
      where: { id: req.params.id },
      data: req.body,
      include: {
        course: { select: { name: true } },
        lecturer: { select: { firstName: true, lastName: true } },
        room: { select: { name: true } },
      },
    });

    await clearCache(CACHE_PATTERN);
    await logAudit({ action: 'update_group', performedBy: req.user.email, performedById: req.user.id, targetType: 'group', targetId: req.params.id, details: `Updated group ${group.name}` });
    res.json(group);
  } catch (err) {
    console.error('Update group error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  try {
    const existing = await prisma.group.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ message: 'Group not found.' });

    const enrolledCount = await prisma.enrollment.count({
      where: { groupId: req.params.id, status: { not: 'DROPPED' } },
    });
    if (enrolledCount > 0) {
      return res.status(400).json({ message: `Cannot delete group: ${enrolledCount} student(s) still enrolled.` });
    }

    await prisma.group.delete({ where: { id: req.params.id } });
    await clearCache(CACHE_PATTERN);
    await logAudit({ action: 'delete_group', performedBy: req.user.email, performedById: req.user.id, targetType: 'group', targetId: req.params.id, details: `Deleted group ${existing.name}` });
    res.json({ message: 'Group deleted.' });
  } catch (err) {
    console.error('Delete group error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

module.exports = router;