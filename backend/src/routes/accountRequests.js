const { Router } = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const prisma = require('../db');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { accountRequestSchema, approveRequestSchema } = require('../validation');

const router = Router();

// GET / — list all (admin only)
router.get('/', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  const requests = await prisma.accountRequest.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(requests);
});

// POST / — submit a new request
router.post('/', validate(accountRequestSchema), async (req, res) => {
  try {
    const { name, email, studentId, classOrSubject, message } = req.body;
    if (!name || !email || !studentId) {
      return res.status(400).json({ message: 'Name, email, and student ID are required.' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ message: 'A user with this email already exists.' });

    const existingRequest = await prisma.accountRequest.findFirst({ where: { email, status: 'pending' } });
    if (existingRequest) return res.status(409).json({ message: 'You already have a pending request.' });

    const studentInDb = await prisma.student.findFirst({ where: { studentNumber: studentId } });
    const flagged = !studentInDb;

    const request = await prisma.accountRequest.create({
      data: {
        id: crypto.randomUUID(),
        name,
        email,
        studentId,
        classOrSubject: classOrSubject ?? null,
        message: message ?? null,
        flagged,
      },
    });

    res.status(201).json(request);
  } catch (err) {
    console.error('Account request error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// PUT /:id/approve — approve a request
router.put('/:id/approve', authenticate, validate(approveRequestSchema), async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  try {
    const { schoolEmail, password } = req.body;
    if (!schoolEmail || !password) return res.status(400).json({ message: 'School email and password are required.' });

    const request = await prisma.accountRequest.findUnique({ where: { id: req.params.id } });
    if (!request || request.status !== 'pending') return res.status(400).json({ message: 'Request not found or already processed.' });

    if (request.flagged) {
      return res.status(400).json({ message: 'This request was flagged — student ID not found in the system. Reject it instead.' });
    }

    const hash = await bcrypt.hash(password, 10);
    const userId = crypto.randomUUID();

    await prisma.$transaction([
      prisma.user.create({
        data: {
          id: userId,
          name: request.name,
          email: schoolEmail,
          password: hash,
          role: 'student',
          emailVerified: false,
        },
      }),
      prisma.accountRequest.update({
        where: { id: request.id },
        data: { status: 'approved', schoolEmail, password: hash, approvedAt: new Date() },
      }),
    ]);

    res.json({ message: 'Account approved.' });
  } catch (err) {
    console.error('Approve error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// PUT /:id/reject — reject a request
router.put('/:id/reject', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  try {
    await prisma.accountRequest.update({
      where: { id: req.params.id },
      data: { status: 'rejected' },
    });
    res.json({ message: 'Request rejected.' });
  } catch (err) {
    console.error('Reject error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

module.exports = router;
