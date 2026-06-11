const { Router } = require('express');
const crypto = require('crypto');
const prisma = require('../db');
const { authenticate } = require('../middleware/auth');
const { cache, clearCache } = require('../middleware/cache');
const { validate } = require('../middleware/validate');
const { calendarEventSchema } = require('../validation');
const { logAudit } = require('../helpers');

const router = Router();

const CACHE_PATTERN = 'cache:/api/v1/calendar-events*';

router.get('/', authenticate, cache(120), async (req, res) => {
  try {
    const { type, startDate, endDate } = req.query;
    const where = {};
    if (type) where.type = type;
    if (startDate) where.date = { gte: startDate };
    if (endDate) where.date = { ...where.date, lte: endDate };
    const events = await prisma.calendarEvent.findMany({
      where,
      orderBy: [{ date: 'asc' }, { time: 'asc' }],
    });
    res.json(events);
  } catch (err) {
    console.error('Get calendar events error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const event = await prisma.calendarEvent.findUnique({ where: { id: req.params.id } });
    if (!event) return res.status(404).json({ message: 'Event not found.' });
    res.json(event);
  } catch (err) {
    console.error('Get calendar event error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

router.post('/', authenticate, validate(calendarEventSchema), async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  try {
    const { title, description, type, date, time, endTime, courseName, targetRoles } = req.body;
    if (!title || !type || !date) {
      return res.status(400).json({ message: 'title, type, and date are required.' });
    }
    const id = crypto.randomUUID();
    const event = await prisma.calendarEvent.create({
      data: {
        id, title,
        description: description ?? null,
        type, date,
        time: time ?? null,
        endTime: endTime ?? null,
        courseName: courseName ?? null,
        targetRoles: targetRoles ?? [],
        createdBy: req.user.email,
      },
    });
    await clearCache(CACHE_PATTERN);
    await logAudit({ action: 'create_calendar_event', performedBy: req.user.email, performedById: req.user.id, targetType: 'calendar_event', targetId: event.id, details: `Created event "${title}"` });
    res.status(201).json(event);
  } catch (err) {
    console.error('Create calendar event error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

router.put('/:id', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  try {
    const event = await prisma.calendarEvent.update({
      where: { id: req.params.id },
      data: req.body,
    });
    await clearCache(CACHE_PATTERN);
    await logAudit({ action: 'update_calendar_event', performedBy: req.user.email, performedById: req.user.id, targetType: 'calendar_event', targetId: req.params.id, details: `Updated event "${event.title}"` });
    res.json(event);
  } catch (err) {
    console.error('Update calendar event error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  try {
    const deleted = await prisma.calendarEvent.delete({ where: { id: req.params.id } });
    await clearCache(CACHE_PATTERN);
    await logAudit({ action: 'delete_calendar_event', performedBy: req.user.email, performedById: req.user.id, targetType: 'calendar_event', targetId: req.params.id, details: `Deleted event "${deleted.title}"` });
    res.json({ message: 'Event deleted.' });
  } catch (err) {
    console.error('Delete calendar event error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

module.exports = router;
