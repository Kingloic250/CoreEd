const express = require('express');
const router = express.Router();
const prisma = require('../db');
const { generateId, logAudit } = require('../helpers');
const { authenticate } = require('../middleware/auth');
const { gradeCreateSchema, gradeReviewSchema } = require('../validation');

function isAdmin(req) {
  return req.user && req.user.role === 'admin';
}
function isLecturer(req) {
  return req.user && req.user.role === 'lecturer';
}

// GET /api/v1/grades — lecturer sees grades for their courses, admin sees all
router.get('/', authenticate, async (req, res) => {
  try {
    const { courseId, groupId, semester, status, studentId } = req.query;
    const where = {};
    if (courseId) where.courseId = courseId;
    if (groupId) where.groupId = groupId;
    if (semester) where.semester = semester;
    if (status) where.status = status;
    if (studentId) where.studentId = studentId;

    if (isLecturer(req)) {
      const lecturer = await prisma.lecturer.findUnique({ where: { email: req.user.email } });
      if (!lecturer) return res.status(403).json({ message: 'Lecturer profile not found' });
      where.lecturerId = lecturer.id;
    }

    const grades = await prisma.grade.findMany({
      where,
      orderBy: { id: 'desc' },
    });
    res.json(grades);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch grades' });
  }
});

// GET /api/v1/grades/admin — admin-only view with lecturer filter
router.get('/admin', authenticate, async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ message: 'Admin only' });
  try {
    const { courseId, lecturerId, groupId, status, semester } = req.query;
    const where = {};
    if (courseId) where.courseId = courseId;
    if (lecturerId) where.lecturerId = lecturerId;
    if (groupId) where.groupId = groupId;
    if (status) where.status = status;
    if (semester) where.semester = semester;

    const grades = await prisma.grade.findMany({
      where,
      include: {
        student: { select: { id: true, firstName: true, lastName: true, studentNumber: true } },
        course: { select: { id: true, name: true } },
        group: { select: { id: true, name: true } },
        lecturer: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { id: 'desc' },
    });
    res.json(grades);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch grades' });
  }
});

// POST /api/v1/grades — create or update a grade (lecturer only)
router.post('/', authenticate, async (req, res) => {
  if (!isLecturer(req)) return res.status(403).json({ message: 'Lecturer only' });
  try {
    const parsed = gradeCreateSchema.parse(req.body);
    const lecturer = await prisma.lecturer.findUnique({ where: { email: req.user.email } });
    if (!lecturer) return res.status(403).json({ message: 'Lecturer profile not found' });

    const existing = await prisma.grade.findFirst({
      where: {
        studentId: parsed.studentId,
        courseId: parsed.courseId,
        semester: parsed.semester || undefined,
      },
    });

    const data = {
      studentId: parsed.studentId,
      courseId: parsed.courseId,
      groupId: parsed.groupId || null,
      semester: parsed.semester || null,
      score: parsed.score,
      maxScore: parsed.maxScore,
      grade: parsed.grade || null,
      comments: parsed.comments || null,
      componentScores: parsed.componentScores || {},
      lecturerId: lecturer.id,
      status: existing?.status === 'submitted' ? 'submitted' : 'draft',
    };

    let grade;
    if (existing) {
      if (existing.status !== 'draft') {
        return res.status(400).json({ message: 'Cannot edit a non-draft grade. Re-submit first.' });
      }
      grade = await prisma.grade.update({ where: { id: existing.id }, data });
      await logAudit({
        action: 'update_grade', performedBy: req.user.name, performedById: req.user.id,
        targetType: 'grade', targetId: grade.id, details: `Updated grade for student ${parsed.studentId} course ${parsed.courseId}`,
      });
    } else {
      grade = await prisma.grade.create({ data: { id: generateId('gr'), ...data } });
      await logAudit({
        action: 'create_grade', performedBy: req.user.name, performedById: req.user.id,
        targetType: 'grade', targetId: grade.id, details: `Created grade for student ${parsed.studentId} course ${parsed.courseId}`,
      });
    }

    res.json(grade);
  } catch (err) {
    if (err.errors) return res.status(400).json({ message: 'Validation error', errors: err.errors });
    console.error(err);
    res.status(500).json({ message: 'Failed to save grade' });
  }
});

// POST /api/v1/grades/submit — submit all draft grades for a course+group
router.post('/submit', authenticate, async (req, res) => {
  if (!isLecturer(req)) return res.status(403).json({ message: 'Lecturer only' });
  try {
    const { courseId, groupId, semester } = req.body;
    if (!courseId) return res.status(400).json({ message: 'courseId is required' });

    const lecturer = await prisma.lecturer.findUnique({ where: { email: req.user.email } });
    if (!lecturer) return res.status(403).json({ message: 'Lecturer profile not found' });

    const where = { courseId, lecturerId: lecturer.id, status: 'draft' };
    if (groupId) where.groupId = groupId;
    if (semester) where.semester = semester;

    const result = await prisma.grade.updateMany({
      where,
      data: { status: 'submitted', submittedAt: new Date() },
    });

    await logAudit({
      action: 'submit_grades', performedBy: req.user.name, performedById: req.user.id,
      targetType: 'grade', details: `Submitted ${result.count} grade(s) for course ${courseId} group ${groupId || 'all'}`,
    });

    res.json({ message: 'Grades submitted for review', count: result.count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to submit grades' });
  }
});

// PUT /api/v1/grades/:id/approve — admin approves a grade
router.put('/:id/approve', authenticate, async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ message: 'Admin only' });
  try {
    const grade = await prisma.grade.findUnique({ where: { id: req.params.id } });
    if (!grade) return res.status(404).json({ message: 'Grade not found' });
    if (grade.status !== 'submitted') return res.status(400).json({ message: 'Only submitted grades can be approved' });

    const updated = await prisma.grade.update({
      where: { id: req.params.id },
      data: { status: 'approved', approvedAt: new Date(), approvedById: req.user.id },
    });

    await logAudit({
      action: 'approve_grade', performedBy: req.user.name, performedById: req.user.id,
      targetType: 'grade', targetId: grade.id, details: `Approved grade for student ${grade.studentId}`,
    });

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to approve grade' });
  }
});

// PUT /api/v1/grades/:id/reject — admin rejects a grade
router.put('/:id/reject', authenticate, async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ message: 'Admin only' });
  try {
    const parsed = gradeReviewSchema.parse(req.body);
    const grade = await prisma.grade.findUnique({ where: { id: req.params.id } });
    if (!grade) return res.status(404).json({ message: 'Grade not found' });
    if (grade.status !== 'submitted') return res.status(400).json({ message: 'Only submitted grades can be rejected' });

    const updated = await prisma.grade.update({
      where: { id: req.params.id },
      data: { status: 'rejected', rejectedAt: new Date(), rejectedById: req.user.id, rejectionNote: parsed.rejectionNote || null },
    });

    await logAudit({
      action: 'reject_grade', performedBy: req.user.name, performedById: req.user.id,
      targetType: 'grade', targetId: grade.id, details: `Rejected grade for student ${grade.studentId}: ${parsed.rejectionNote || 'no reason'}`,
    });

    res.json(updated);
  } catch (err) {
    if (err.errors) return res.status(400).json({ message: 'Validation error', errors: err.errors });
    console.error(err);
    res.status(500).json({ message: 'Failed to reject grade' });
  }
});

// POST /api/v1/grades/approve-all — admin approves all submitted grades for course+group
router.post('/approve-all', authenticate, async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ message: 'Admin only' });
  try {
    const { courseId, groupId } = req.body;
    if (!courseId) return res.status(400).json({ message: 'courseId is required' });

    const where = { courseId, status: 'submitted' };
    if (groupId) where.groupId = groupId;

    const result = await prisma.grade.updateMany({
      where,
      data: { status: 'approved', approvedAt: new Date(), approvedById: req.user.id },
    });

    await logAudit({
      action: 'approve_all_grades', performedBy: req.user.name, performedById: req.user.id,
      targetType: 'grade', details: `Approved ${result.count} grade(s) for course ${courseId} group ${groupId || 'all'}`,
    });

    res.json({ message: 'Grades approved', count: result.count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to approve grades' });
  }
});

// GET /api/v1/grades/student/:studentId/transcript
router.get('/student/:studentId/transcript', authenticate, async (req, res) => {
  try {
    const grades = await prisma.grade.findMany({
      where: { studentId: req.params.studentId },
      include: { course: { select: { name: true, credits: true } } },
      orderBy: { semester: 'asc' },
    });
    res.json(grades);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch transcript' });
  }
});

module.exports = router;
