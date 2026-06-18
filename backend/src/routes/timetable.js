const { Router } = require('express');
const crypto = require('crypto');
const prisma = require('../db');
const { authenticate } = require('../middleware/auth');
const { cache, clearCache } = require('../middleware/cache');
const { logAudit } = require('../helpers');

const router = Router();

const CACHE_PATTERN = 'cache:/api/v1/timetable*';

// GET /api/v1/timetable?facultyId=&year=&semesterId=
router.get('/', authenticate, cache(60), async (req, res) => {
  try {
    const { facultyId, year, semesterId } = req.query;
    const where = {};
    if (facultyId) where.course = { ...where.course, facultyId };
    if (year) where.course = { ...where.course, year };
    if (semesterId) where.course = { ...where.course, semesterId };

    const entries = await prisma.timetableEntry.findMany({
      where,
      include: {
        course: { select: { id: true, name: true, year: true, lecturerId: true } },
        room: { select: { id: true, name: true } },
      },
      orderBy: [{ day: 'asc' }, { startTime: 'asc' }],
    });
    res.json(entries);
  } catch (err) {
    console.error('Get timetable error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// POST /api/v1/timetable/generate — AI schedule generation
router.post('/generate', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  try {
    const { facultyId, semesterId, daysOfWeek, timeStart, timeEnd, periodDuration, periodsPerDay } = req.body;

    if (!facultyId || !daysOfWeek || !timeStart || !timeEnd || !periodDuration || !periodsPerDay) {
      return res.status(400).json({ message: 'facultyId, daysOfWeek, timeStart, timeEnd, periodDuration, and periodsPerDay are required.' });
    }

    // Fetch courses for the given faculty/semester
    const courseWhere = { facultyId };
    if (semesterId) courseWhere.semesterId = semesterId;

    const courses = await prisma.course.findMany({
      where: courseWhere,
      include: { lecturer: { select: { id: true, firstName: true, lastName: true } }, room: { select: { id: true, name: true } } },
    });

    if (courses.length === 0) {
      return res.status(400).json({ message: 'No courses found for the selected faculty/semester.' });
    }

    // Fetch existing timetable entries to avoid conflicts
    const existingEntries = await prisma.timetableEntry.findMany({
      include: { course: { select: { name: true } }, room: { select: { name: true } } },
    });

    // Fetch all rooms
    const rooms = await prisma.room.findMany({ orderBy: { name: 'asc' } });

    // Build prompt for Gemini
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const selectedDays = (daysOfWeek).map(d => dayNames[d]).filter(Boolean);

    const coursesInfo = courses.map(c => ({
      id: c.id,
      name: c.name,
      lecturer: c.lecturer ? `${c.lecturer.firstName} ${c.lecturer.lastName}` : 'Unassigned',
      lecturerId: c.lecturerId,
      room: c.room?.name ?? null,
      roomId: c.room?.id ?? null,
    }));

    const existingInfo = existingEntries.map(e => ({
      course: e.course?.name ?? 'Unknown',
      day: dayNames[e.day] ?? `Day ${e.day}`,
      startTime: e.startTime,
      endTime: e.endTime,
      room: e.room?.name ?? null,
    }));

    const roomInfo = rooms.map(r => ({ id: r.id, name: r.name, capacity: r.capacity, building: r.building }));

    const prompt = `You are a university timetable generator. Generate a weekly schedule as a JSON array.

COURSES TO SCHEDULE:
${JSON.stringify(coursesInfo, null, 2)}

AVAILABLE ROOMS:
${JSON.stringify(roomInfo, null, 2)}

EXISTING SCHEDULE ENTRIES (do not create conflicts with these):
${JSON.stringify(existingInfo, null, 2)}

CONSTRAINTS:
- Days: ${selectedDays.join(', ')}
- Time range: ${timeStart} - ${timeEnd}
- Period duration: ${periodDuration} minutes
- Max periods per day per course: 1
- Max periods per day: ${periodsPerDay}
- No lecturer should have two courses at the same time
- No two courses can use the same room at the same time
- Distribute courses evenly across the week
- If a course already has a preferred room (roomId), try to use it

Return ONLY a valid JSON array — no markdown, no explanation. Each entry:
{ "courseId": "...", "day": <0-6>, "startTime": "HH:MM", "endTime": "HH:MM", "roomId": "..." | null }`;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ message: 'GEMINI_API_KEY not configured.' });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 8192 },
        }),
      }
    );

    if (!response.ok) {
      const errBody = await response.text();
      console.error('Gemini API error:', errBody);
      return res.status(502).json({ message: 'AI generation failed. Check GEMINI_API_KEY.' });
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    // Parse JSON from response (handling markdown code fences)
    let jsonStr = text.trim();
    const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) jsonStr = codeBlockMatch[1].trim();
    const firstBracket = jsonStr.indexOf('[');
    const lastBracket = jsonStr.lastIndexOf(']');
    if (firstBracket !== -1 && lastBracket !== -1) {
      jsonStr = jsonStr.slice(firstBracket, lastBracket + 1);
    }

    let schedule;
    try {
      schedule = JSON.parse(jsonStr);
    } catch {
      console.error('Failed to parse Gemini response:', text);
      return res.status(502).json({ message: 'AI returned invalid JSON.' });
    }

    if (!Array.isArray(schedule)) {
      return res.status(502).json({ message: 'AI returned unexpected format.' });
    }

    // Validate entries
    const validEntries = schedule.filter((entry) => {
      return (
        entry.courseId &&
        typeof entry.day === 'number' &&
        entry.day >= 0 && entry.day <= 6 &&
        entry.startTime && entry.endTime
      );
    });

    if (validEntries.length === 0) {
      return res.status(502).json({ message: 'AI generated no valid schedule entries.' });
    }

    res.json({ entries: validEntries, total: validEntries.length });
  } catch (err) {
    console.error('Generate timetable error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// POST /api/v1/timetable/apply — save generated schedule
router.post('/apply', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  try {
    const { entries } = req.body;
    if (!Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({ message: 'entries array is required.' });
    }

    // Validate and create entries
    const created = await prisma.$transaction(
      entries.map((entry) =>
        prisma.timetableEntry.create({
          data: {
            id: crypto.randomUUID(),
            courseId: entry.courseId,
            day: entry.day,
            startTime: entry.startTime,
            endTime: entry.endTime,
            roomId: entry.roomId ?? null,
          },
        })
      )
    );

    await clearCache(CACHE_PATTERN);
    await logAudit({ action: 'apply_timetable', performedBy: req.user.email, performedById: req.user.id, targetType: 'timetable', targetId: 'bulk', details: `Applied ${created.length} timetable entries` });
    res.json({ message: `Applied ${created.length} timetable entries.`, count: created.length });
  } catch (err) {
    console.error('Apply timetable error:', err);
    res.status(500).json({ message: err?.message || 'Internal server error.' });
  }
});

// POST /api/v1/timetable/entries — create single entry (manual)
router.post('/entries', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  try {
    const { courseId, day, startTime, endTime, roomId } = req.body;
    if (!courseId || day === undefined || !startTime || !endTime) {
      return res.status(400).json({ message: 'courseId, day, startTime, and endTime are required.' });
    }

    const id = crypto.randomUUID();
    const entry = await prisma.timetableEntry.create({
      data: { id, courseId, day, startTime, endTime, roomId: roomId ?? null },
      include: { course: { select: { name: true } }, room: { select: { name: true } } },
    });

    await clearCache(CACHE_PATTERN);
    await logAudit({ action: 'create_timetable_entry', performedBy: req.user.email, performedById: req.user.id, targetType: 'timetable', targetId: entry.id, details: `Created timetable entry for course ${entry.course?.name ?? courseId}` });
    res.status(201).json(entry);
  } catch (err) {
    console.error('Create timetable entry error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// PUT /api/v1/timetable/entries/:id — update entry (manual)
router.put('/entries/:id', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  try {
    const entry = await prisma.timetableEntry.update({
      where: { id: req.params.id },
      data: req.body,
      include: { course: { select: { name: true } }, room: { select: { name: true } } },
    });
    await clearCache(CACHE_PATTERN);
    await logAudit({ action: 'update_timetable_entry', performedBy: req.user.email, performedById: req.user.id, targetType: 'timetable', targetId: req.params.id, details: `Updated timetable entry` });
    res.json(entry);
  } catch (err) {
    console.error('Update timetable entry error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// DELETE /api/v1/timetable/entries/:id — delete entry
router.delete('/entries/:id', authenticate, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });
  try {
    await prisma.timetableEntry.delete({ where: { id: req.params.id } });
    await clearCache(CACHE_PATTERN);
    await logAudit({ action: 'delete_timetable_entry', performedBy: req.user.email, performedById: req.user.id, targetType: 'timetable', targetId: req.params.id, details: `Deleted timetable entry` });
    res.json({ message: 'Entry deleted.' });
  } catch (err) {
    console.error('Delete timetable entry error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

module.exports = router;