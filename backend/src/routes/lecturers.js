const { Router } = require('express');
const crypto = require('crypto');
const prisma = require('../db');
const { authenticate } = require('../middleware/auth');
const { cache, clearCache } = require('../middleware/cache');
const { validate } = require('../middleware/validate');
const { lecturerCreateSchema } = require('../validation');
const { sendInvitationEmail } = require('../services/mail');

const router = Router();

const CACHE_PATTERN = 'cache:/api/v1/lecturers';

router.get('/', authenticate, cache(120), async (req, res) => {
  const lecturers = await prisma.lecturer.findMany({ orderBy: { firstName: 'asc' } });
  res.json(lecturers);
});

router.get('/invitation/:token', async (req, res) => {
  try {
    const lecturer = await prisma.lecturer.findUnique({ where: { invitationToken: req.params.token } });
    if (!lecturer) return res.status(404).json({ message: 'Invalid or expired invitation link.' });
    if (lecturer.invitationAcceptedAt) return res.status(400).json({ message: 'This invitation has already been used.' });
    if (lecturer.invitationTokenExpires && new Date() > lecturer.invitationTokenExpires) {
      return res.status(400).json({ message: 'This invitation has expired.' });
    }
    res.json({ firstName: lecturer.firstName, lastName: lecturer.lastName });
  } catch (err) {
    console.error('Invitation lookup error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

router.post('/', authenticate, validate(lecturerCreateSchema), async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  try {
    const { firstName, lastName, email, department, qualification, joinDate } = req.body;
    if (!firstName || !lastName || !email) return res.status(400).json({ message: 'firstName, lastName, and email are required.' });
    const existing = await prisma.lecturer.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ message: 'A lecturer with this email already exists.' });

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

    const id = crypto.randomUUID();
    const lecturer = await prisma.lecturer.create({
      data: {
        id, firstName, lastName, email, department: department ?? null,
        assignedCourses: [],
        qualification: qualification ?? null, joinDate: joinDate ?? null,
        invitationToken: token,
        invitationTokenExpires: expiresAt,
      },
    });

    try {
      await sendInvitationEmail(email, firstName, lastName, token);
    } catch (mailErr) {
      console.error('Invitation email failed:', mailErr);
    }

    await clearCache(CACHE_PATTERN);
    const { invitationToken, ...safe } = lecturer;
    res.status(201).json(safe);
  } catch (err) {
    console.error('Create lecturer error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

router.put('/:id', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  try {
    const lecturer = await prisma.lecturer.update({
      where: { id: req.params.id },
      data: req.body,
    });
    await clearCache(CACHE_PATTERN);
    res.json(lecturer);
  } catch (err) {
    res.status(500).json({ message: 'Internal server error.' });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  try {
    await prisma.lecturer.delete({ where: { id: req.params.id } });
    await clearCache(CACHE_PATTERN);
    res.json({ message: 'Lecturer deleted.' });
  } catch (err) {
    console.error('Delete lecturer error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

module.exports = router;
