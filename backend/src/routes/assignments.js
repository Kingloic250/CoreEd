const { Router } = require('express');
const crypto = require('crypto');
const prisma = require('../db');
const { authenticate } = require('../middleware/auth');
const { uploadAttachment } = require('../middleware/upload');
const { uploadBuffer } = require('../services/cloudinary');

const router = Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const { courseId, studentId } = req.query;
    const where = {};
    if (courseId) where.courseId = courseId;
    if (studentId) where.studentId = studentId;

    const assignments = await prisma.assignment.findMany({
      where,
      include: { submissions: studentId ? { where: { studentId } } : false },
      orderBy: { createdAt: 'desc' },
    });
    res.json(assignments);
  } catch (err) {
    console.error('Get assignments error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const assignment = await prisma.assignment.findUnique({
      where: { id: req.params.id },
      include: { submissions: true },
    });
    if (!assignment) return res.status(404).json({ message: 'Assignment not found.' });
    res.json(assignment);
  } catch (err) {
    console.error('Get assignment error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

router.post('/', authenticate, async (req, res) => {
  if (req.user.role !== 'lecturer' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  try {
    const { courseId, courseName, title, description, dueDate, maxScore } = req.body;
    if (!title) return res.status(400).json({ message: 'Title is required.' });

    const id = crypto.randomUUID();
    const assignment = await prisma.assignment.create({
      data: {
        id, courseId, courseName, title, description, dueDate,
        maxScore: maxScore ?? 100,
        attachments: req.body.attachments ?? [],
      },
    });
    res.status(201).json(assignment);
  } catch (err) {
    console.error('Create assignment error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

router.put('/:id', authenticate, async (req, res) => {
  if (req.user.role !== 'lecturer' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  try {
    const assignment = await prisma.assignment.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(assignment);
  } catch (err) {
    console.error('Update assignment error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  if (req.user.role !== 'lecturer' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  try {
    await prisma.assignment.delete({ where: { id: req.params.id } });
    res.json({ message: 'Assignment deleted.' });
  } catch (err) {
    console.error('Delete assignment error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

router.post('/:id/submit', authenticate, uploadAttachment.single('file'), async (req, res) => {
  try {
    const { studentId, content } = req.body;
    if (!studentId) return res.status(400).json({ message: 'studentId is required.' });

    const assignment = await prisma.assignment.findUnique({ where: { id: req.params.id } });
    if (!assignment) return res.status(404).json({ message: 'Assignment not found.' });

    let fileUrl = null;
    if (req.file) {
      const result = await uploadBuffer(req.file.buffer, {
        folder: `coreed/assignments/${req.params.id}`,
        publicId: studentId,
      });
      fileUrl = result.secure_url;
    } else if (req.body.fileUrl) {
      fileUrl = req.body.fileUrl;
    }

    const existing = await prisma.assignmentSubmission.findFirst({
      where: { assignmentId: req.params.id, studentId },
    });

    let submission;
    if (existing) {
      submission = await prisma.assignmentSubmission.update({
        where: { id: existing.id },
        data: { fileUrl, content: content ?? existing.content, submittedAt: new Date() },
      });
    } else {
      const id = crypto.randomUUID();
      submission = await prisma.assignmentSubmission.create({
        data: { id, assignmentId: req.params.id, studentId, fileUrl, content: content ?? null, submittedAt: new Date() },
      });
    }

    res.status(201).json(submission);
  } catch (err) {
    console.error('Submit assignment error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

router.put('/:id/grade/:studentId', authenticate, async (req, res) => {
  if (req.user.role !== 'lecturer' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  try {
    const { score, feedback } = req.body;
    const submission = await prisma.assignmentSubmission.updateMany({
      where: { assignmentId: req.params.id, studentId: req.params.studentId },
      data: { score, feedback, status: 'graded', gradedAt: new Date() },
    });
    res.json(submission);
  } catch (err) {
    console.error('Grade submission error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

module.exports = router;
