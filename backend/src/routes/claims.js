const express = require('express');
const router = express.Router();
const prisma = require('../db');
const { generateId, logAudit } = require('../helpers');
const { authenticate } = require('../middleware/auth');

// GET /api/v1/claims — list claims (lecturer sees their course claims, admin sees all)
router.get('/', authenticate, async (req, res) => {
  try {
    const { studentId, status } = req.query;
    const where = {};
    if (studentId) where.studentId = studentId;
    if (status) where.status = status;

    if (req.user.role === 'lecturer') {
      const lecturer = await prisma.lecturer.findUnique({ where: { email: req.user.email } });
      if (!lecturer) return res.status(403).json({ message: 'Lecturer profile not found' });
      const courseIds = await prisma.course.findMany({
        where: { lecturerId: lecturer.id },
        select: { id: true },
      });
      where.courseId = { in: courseIds.map(c => c.id) };
    }

    const claims = await prisma.claim.findMany({
      where,
      include: {
        student: { select: { id: true, firstName: true, lastName: true, studentNumber: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(claims);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch claims' });
  }
});

// POST /api/v1/claims — create a claim (student only)
router.post('/', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'student') return res.status(403).json({ message: 'Students only' });
    const student = await prisma.student.findUnique({ where: { email: req.user.email } });
    if (!student) return res.status(403).json({ message: 'Student profile not found' });

    const { gradeId, subject, semester, claimedGrade, reason, courseId } = req.body;
    if (!gradeId || !subject || !reason) {
      return res.status(400).json({ message: 'gradeId, subject, and reason are required' });
    }

    const claim = await prisma.claim.create({
      data: {
        id: generateId('cl'),
        gradeId,
        studentId: student.id,
        subject,
        semester: semester || null,
        claimedGrade: claimedGrade || null,
        reason,
        courseId: courseId || null,
      },
    });

    await logAudit({
      action: 'create_claim', performedBy: req.user.name, performedById: req.user.id,
      targetType: 'claim', targetId: claim.id,
      details: `Student ${student.id} filed claim for grade ${gradeId}`,
    });

    res.json(claim);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create claim' });
  }
});

// PATCH /api/v1/claims/:id — resolve claim (lecturer or admin)
router.patch('/:id', authenticate, async (req, res) => {
  try {
    const claim = await prisma.claim.findUnique({ where: { id: req.params.id } });
    if (!claim) return res.status(404).json({ message: 'Claim not found' });
    if (claim.status !== 'pending') return res.status(400).json({ message: 'Claim already resolved' });

    const { status, resolutionNote } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status must be approved or rejected' });
    }

    const updated = await prisma.claim.update({
      where: { id: req.params.id },
      data: {
        status,
        resolvedAt: new Date(),
        resolvedBy: req.user.name,
        resolutionNote: resolutionNote || null,
      },
    });

    await logAudit({
      action: status === 'approved' ? 'approve_claim' : 'reject_claim',
      performedBy: req.user.name, performedById: req.user.id,
      targetType: 'claim', targetId: claim.id,
      details: `Claim ${status} by ${req.user.name}: ${resolutionNote || 'no note'}`,
    });

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update claim' });
  }
});

module.exports = router;
