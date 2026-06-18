const express = require('express');
const router = express.Router();
const prisma = require('../db');
const { generateId, logAudit } = require('../helpers');
const { authenticate } = require('../middleware/auth');
const { examCreateSchema, examResultSchema } = require('../validation');

function isAdmin(req) { return req.user && req.user.role === 'admin'; }
function isLecturer(req) { return req.user && req.user.role === 'lecturer'; }

// GET /api/v1/exams — list exams, filterable
router.get('/', authenticate, async (req, res) => {
  try {
    const { courseId, groupId, lecturerId, status, type } = req.query;
    const where = {};
    if (courseId) where.courseId = courseId;
    if (groupId) where.groupId = groupId;
    if (lecturerId) where.lecturerId = lecturerId;
    if (status) where.status = status;
    if (type) where.type = type;

    if (isLecturer(req)) {
      const lecturer = await prisma.lecturer.findUnique({ where: { email: req.user.email } });
      if (lecturer) where.lecturerId = lecturer.id;
    }

    const exams = await prisma.exam.findMany({
      where,
      include: {
        course: { select: { id: true, name: true } },
        group: { select: { id: true, name: true } },
        lecturer: { select: { id: true, firstName: true, lastName: true } },
        room: { select: { id: true, name: true, code: true } },
        _count: { select: { results: true } },
      },
      orderBy: { date: 'desc' },
    });
    res.json(exams);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch exams' });
  }
});

// GET /api/v1/exams/:id — single exam with results
router.get('/:id', authenticate, async (req, res) => {
  try {
    const exam = await prisma.exam.findUnique({
      where: { id: req.params.id },
      include: {
        course: { select: { id: true, name: true, gradingComponents: true } },
        group: { select: { id: true, name: true } },
        lecturer: { select: { id: true, firstName: true, lastName: true } },
        room: { select: { id: true, name: true, code: true } },
        results: {
          include: { student: { select: { id: true, firstName: true, lastName: true, studentNumber: true } } },
        },
      },
    });
    if (!exam) return res.status(404).json({ message: 'Exam not found' });

    // Fetch real enrolled student IDs from Enrollment table
    if (exam.group) {
      const enrollments = await prisma.enrollment.findMany({
        where: { groupId: exam.group.id, status: { not: 'DROPPED' } },
        select: { studentId: true },
      });
      exam.group.enrolledStudentIds = enrollments.map((e) => e.studentId);
    }

    res.json(exam);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch exam' });
  }
});

// POST /api/v1/exams — create exam (admin only)
router.post('/', authenticate, async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ message: 'Admin only' });
  try {
    const parsed = examCreateSchema.parse(req.body);
    const exam = await prisma.exam.create({
      data: {
        id: generateId('ex'),
        ...parsed,
        roomId: parsed.roomId || null,
        gradingComponent: parsed.gradingComponent || null,
      },
    });
    await logAudit({
      action: 'create_exam', performedBy: req.user.name, performedById: req.user.id,
      targetType: 'exam', targetId: exam.id, details: `Created exam "${parsed.title}" for course ${parsed.courseId}`,
    });
    res.json(exam);
  } catch (err) {
    if (err.errors) return res.status(400).json({ message: 'Validation error', errors: err.errors });
    console.error(err);
    res.status(500).json({ message: 'Failed to create exam' });
  }
});

// PUT /api/v1/exams/:id — update exam (admin only)
router.put('/:id', authenticate, async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ message: 'Admin only' });
  try {
    const parsed = examCreateSchema.parse(req.body);
    const exam = await prisma.exam.update({
      where: { id: req.params.id },
      data: {
        ...parsed,
        roomId: parsed.roomId || null,
        gradingComponent: parsed.gradingComponent || null,
      },
    });
    await logAudit({
      action: 'update_exam', performedBy: req.user.name, performedById: req.user.id,
      targetType: 'exam', targetId: exam.id, details: `Updated exam "${parsed.title}"`,
    });
    res.json(exam);
  } catch (err) {
    if (err.errors) return res.status(400).json({ message: 'Validation error', errors: err.errors });
    console.error(err);
    res.status(500).json({ message: 'Failed to update exam' });
  }
});

// DELETE /api/v1/exams/:id — delete exam (admin only)
router.delete('/:id', authenticate, async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ message: 'Admin only' });
  try {
    await prisma.examResult.deleteMany({ where: { examId: req.params.id } });
    await prisma.exam.delete({ where: { id: req.params.id } });
    await logAudit({
      action: 'delete_exam', performedBy: req.user.name, performedById: req.user.id,
      targetType: 'exam', targetId: req.params.id,
    });
    res.json({ message: 'Exam deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to delete exam' });
  }
});

// PUT /api/v1/exams/:id/status — change exam status (admin)
router.put('/:id/status', authenticate, async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ message: 'Admin only' });
  try {
    const { status } = req.body;
    if (!['scheduled', 'ongoing', 'completed', 'graded'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const exam = await prisma.exam.update({
      where: { id: req.params.id },
      data: { status },
    });
    res.json(exam);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update exam status' });
  }
});

// POST /api/v1/exams/:id/results — upsert exam results (lecturer)
router.post('/:id/results', authenticate, async (req, res) => {
  if (!isLecturer(req)) return res.status(403).json({ message: 'Lecturer only' });
  try {
    const exam = await prisma.exam.findUnique({ where: { id: req.params.id } });
    if (!exam) return res.status(404).json({ message: 'Exam not found' });

    const lecturer = await prisma.lecturer.findUnique({ where: { email: req.user.email } });
    if (!lecturer || exam.lecturerId !== lecturer.id) {
      return res.status(403).json({ message: 'Not your exam' });
    }

    const parsed = examResultSchema.parse(req.body);
    const existing = await prisma.examResult.findFirst({
      where: { examId: req.params.id, studentId: parsed.studentId },
    });

    let result;
    const data = {
      score: parsed.score,
      comments: parsed.comments || null,
      gradedById: req.user.id,
      gradedAt: new Date(),
      status: existing?.status === 'submitted' ? 'submitted' : 'draft',
    };

    if (existing) {
      if (existing.status !== 'draft') {
        return res.status(400).json({ message: 'Cannot edit a submitted/approved result' });
      }
      result = await prisma.examResult.update({ where: { id: existing.id }, data });
    } else {
      result = await prisma.examResult.create({
        data: { id: generateId('er'), examId: req.params.id, studentId: parsed.studentId, ...data },
      });
    }
    res.json(result);
  } catch (err) {
    if (err.errors) return res.status(400).json({ message: 'Validation error', errors: err.errors });
    console.error(err);
    res.status(500).json({ message: 'Failed to save result' });
  }
});

// POST /api/v1/exams/:id/submit — submit all results for an exam (lecturer)
router.post('/:id/submit', authenticate, async (req, res) => {
  if (!isLecturer(req)) return res.status(403).json({ message: 'Lecturer only' });
  try {
    const lecturer = await prisma.lecturer.findUnique({ where: { email: req.user.email } });
    const exam = await prisma.exam.findUnique({ where: { id: req.params.id } });
    if (!exam || !lecturer || exam.lecturerId !== lecturer.id) {
      return res.status(403).json({ message: 'Not your exam' });
    }

    const result = await prisma.examResult.updateMany({
      where: { examId: req.params.id, status: 'draft' },
      data: { status: 'submitted', gradedAt: new Date(), gradedById: req.user.id },
    });

    await logAudit({
      action: 'submit_exam_results', performedBy: req.user.name, performedById: req.user.id,
      targetType: 'exam', targetId: req.params.id,
      details: `Submitted ${result.count} result(s) for exam`,
    });
    res.json({ message: 'Results submitted for review', count: result.count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to submit results' });
  }
});

// PUT /api/v1/exams/results/:resultId/approve — admin approves
router.put('/results/:resultId/approve', authenticate, async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ message: 'Admin only' });
  try {
    const result = await prisma.examResult.findUnique({ where: { id: req.params.resultId }, include: { exam: true } });
    if (!result) return res.status(404).json({ message: 'Result not found' });
    if (result.status !== 'submitted') return res.status(400).json({ message: 'Only submitted results can be approved' });

    const updated = await prisma.examResult.update({
      where: { id: req.params.resultId },
      data: { status: 'approved', approvedAt: new Date() },
    });

    // Auto-update grade componentScores if the exam has a gradingComponent
    if (result.exam.gradingComponent && result.exam.courseId) {
      const grade = await prisma.grade.findFirst({
        where: { studentId: result.studentId, courseId: result.exam.courseId },
      });
      if (grade) {
        const compScores = (grade.componentScores) || {};
        compScores[result.exam.gradingComponent] = result.score;
        await prisma.grade.update({
          where: { id: grade.id },
          data: { componentScores: compScores },
        });
      }
    }

    await logAudit({
      action: 'approve_exam_result', performedBy: req.user.name, performedById: req.user.id,
      targetType: 'exam_result', targetId: result.id,
    });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to approve result' });
  }
});

// PUT /api/v1/exams/results/:resultId/reject — admin rejects
router.put('/results/:resultId/reject', authenticate, async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ message: 'Admin only' });
  try {
    const result = await prisma.examResult.findUnique({ where: { id: req.params.resultId } });
    if (!result) return res.status(404).json({ message: 'Result not found' });
    if (result.status !== 'submitted') return res.status(400).json({ message: 'Only submitted results can be rejected' });

    const { rejectionNote } = req.body;
    const updated = await prisma.examResult.update({
      where: { id: req.params.resultId },
      data: { status: 'rejected', rejectedAt: new Date(), rejectionNote: rejectionNote || null },
    });
    await logAudit({
      action: 'reject_exam_result', performedBy: req.user.name, performedById: req.user.id,
      targetType: 'exam_result', targetId: result.id,
      details: rejectionNote || 'no reason',
    });
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to reject result' });
  }
});

module.exports = router;
