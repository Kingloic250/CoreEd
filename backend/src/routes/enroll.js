const { Router } = require('express');
const prisma = require('../db');
const { authenticate } = require('../middleware/auth');
const { clearCache } = require('../middleware/cache');
const { logAudit } = require('../helpers');

const router = Router();
const CACHE_PATTERN = 'cache:/api/v1/groups*';

// POST /api/v1/enroll — student enrolls in a course + group
router.post('/', authenticate, async (req, res) => {
  try {
    const { courseId, groupId, studentId } = req.body;
    if (!courseId || !groupId || !studentId) {
      return res.status(400).json({ message: 'courseId, groupId, and studentId are required.' });
    }

    // Only the student themselves or admin can enroll
    if (req.user.role !== 'admin' && req.user.id !== studentId) {
      return res.status(403).json({ message: 'Forbidden.' });
    }

    const group = await prisma.group.findUnique({ where: { id: groupId } });
    if (!group) return res.status(404).json({ message: 'Group not found.' });

    if (group.courseId !== courseId) {
      return res.status(400).json({ message: 'Group does not belong to this course.' });
    }

    const enrolled = (group.enrolledStudentIds ?? []);
    if (enrolled.includes(studentId)) {
      return res.status(400).json({ message: 'Already enrolled in this group.' });
    }

    if (enrolled.length >= group.capacity) {
      return res.status(400).json({ message: 'Group is full.' });
    }

    const updated = await prisma.group.update({
      where: { id: groupId },
      data: { enrolledStudentIds: [...enrolled, studentId] },
    });

    await clearCache(CACHE_PATTERN);
    await logAudit({ action: 'enroll_student', performedBy: req.user.email, performedById: req.user.id, targetType: 'group', targetId: groupId, details: `Student ${studentId} enrolled in group ${group.name}` });
    res.json({ message: 'Enrolled successfully.', enrolledCount: (updated.enrolledStudentIds ?? []).length });
  } catch (err) {
    console.error('Enroll error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// DELETE /api/v1/enroll/:courseId — student unenrolls from course (removes from all groups in that course)
router.delete('/:courseId', authenticate, async (req, res) => {
  try {
    const { studentId } = req.body;
    const { courseId } = req.params;

    if (!studentId) return res.status(400).json({ message: 'studentId is required.' });
    if (req.user.role !== 'admin' && req.user.id !== studentId) {
      return res.status(403).json({ message: 'Forbidden.' });
    }

    const groups = await prisma.group.findMany({ where: { courseId } });
    for (const group of groups) {
      const enrolled = (group.enrolledStudentIds ?? []).filter((id) => id !== studentId);
      await prisma.group.update({
        where: { id: group.id },
        data: { enrolledStudentIds: enrolled },
      });
    }

    await clearCache(CACHE_PATTERN);
    await logAudit({ action: 'unenroll_student', performedBy: req.user.email, performedById: req.user.id, targetType: 'course', targetId: courseId, details: `Student ${studentId} unenrolled from course` });
    res.json({ message: 'Unenrolled successfully.' });
  } catch (err) {
    console.error('Unenroll error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// GET /api/v1/enroll/mine — get student's enrolled courses with group info
router.get('/mine', authenticate, async (req, res) => {
  try {
    const studentId = req.user.role === 'student' ? req.user.id : req.query.studentId;
    if (!studentId) return res.status(400).json({ message: 'studentId is required.' });

    const allGroups = await prisma.group.findMany({
      include: {
        course: { select: { id: true, name: true, credits: true, facultyId: true, department: true } },
        lecturer: { select: { id: true, firstName: true, lastName: true } },
        room: { select: { id: true, name: true } },
        semester: { select: { id: true, name: true, year: true } },
      },
      orderBy: [{ courseId: 'asc' }],
    });

    const groups = allGroups.filter((g) => (g.enrolledStudentIds ?? []).includes(studentId));

    res.json({ groups, courses: [] });
  } catch (err) {
    console.error('Get my enrollments error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// GET /api/v1/enroll/course/:courseId — enrolled students grouped by group (admin/lecturer)
router.get('/course/:courseId', authenticate, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'lecturer') {
    return res.status(403).json({ message: 'Forbidden.' });
  }
  try {
    const groups = await prisma.group.findMany({
      where: { courseId: req.params.courseId },
      include: {
        lecturer: { select: { firstName: true, lastName: true } },
        room: { select: { name: true } },
      },
      orderBy: { name: 'asc' },
    });

    const result = groups.map((g) => ({
      ...g,
      enrolledCount: (g.enrolledStudentIds ?? []).length,
    }));

    res.json(result);
  } catch (err) {
    console.error('Get course enrollments error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

module.exports = router;