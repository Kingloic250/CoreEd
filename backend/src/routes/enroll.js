const { Router } = require('express');
const crypto = require('crypto');
const prisma = require('../db');
const { authenticate } = require('../middleware/auth');
const { clearCache } = require('../middleware/cache');
const { validate } = require('../middleware/validate');
const { logAudit } = require('../helpers');
const { enrollSchema, waitlistSchema, dropSchema } = require('../validation');

const router = Router();
const CACHE_PATTERN = 'cache:/api/v1/groups*';

const todayStr = () => new Date().toISOString().split('T')[0];

// POST /api/v1/enroll — full registration flow
router.post('/', authenticate, validate(enrollSchema), async (req, res) => {
  try {
    const { courseId, groupId, studentId } = req.body;
    if (req.user.role !== 'admin' && req.user.id !== studentId) {
      return res.status(403).json({ message: 'Forbidden.' });
    }

    const [group, course] = await Promise.all([
      prisma.group.findUnique({ where: { id: groupId } }),
      prisma.course.findUnique({ where: { id: courseId } }),
    ]);
    if (!group) return res.status(404).json({ message: 'Group not found.' });
    if (!course) return res.status(404).json({ message: 'Course not found.' });
    if (group.courseId !== courseId) {
      return res.status(400).json({ message: 'Group does not belong to this course.' });
    }

    // 1. Check registration window if active semester has one
    const semester = group.semesterId
      ? await prisma.semester.findUnique({ where: { id: group.semesterId } })
      : null;
    if (semester && semester.registrationOpenDate && semester.registrationCloseDate) {
      const today = todayStr();
      if (today < semester.registrationOpenDate) {
        return res.status(400).json({ message: `Registration opens on ${semester.registrationOpenDate}.` });
      }
      if (today > semester.registrationCloseDate) {
        return res.status(400).json({ message: `Registration closed on ${semester.registrationCloseDate}.` });
      }
    }

    // 2. Check duplicate enrollment
    const existing = await prisma.enrollment.findFirst({
      where: { studentId, groupId, semesterId: group.semesterId ?? undefined, status: { not: 'DROPPED' } },
    });
    if (existing) {
      return res.status(400).json({ message: 'Already enrolled in this group.' });
    }

    // 3. Check group capacity
    const enrolledCount = await prisma.enrollment.count({
      where: { groupId, status: { in: ['REGISTERED', 'COMPLETED'] } },
    });
    if (enrolledCount >= group.capacity) {
      return res.status(400).json({ message: 'Group is full.' });
    }

    // 4. Check course-level capacity (maxStudents)
    if (course.maxStudents) {
      const courseEnrolled = await prisma.enrollment.count({
        where: { courseId, status: { not: 'DROPPED' } },
      });
      if (courseEnrolled >= course.maxStudents) {
        return res.status(400).json({ message: 'Course has reached maximum capacity.' });
      }
    }

    // 5. Check credit limit (for non-admin)
    const activeSemester = semester ?? (await prisma.semester.findFirst({ where: { isActive: 1 } }));
    if (!activeSemester && req.user.role !== 'admin') {
      return res.status(400).json({ message: 'No active semester. Enrollment is not available.' });
    }
    if (activeSemester && req.user.role !== 'admin') {
      const maxCredits = (await prisma.student.findUnique({ where: { id: studentId } }))?.maxCredits
        ?? activeSemester.maxCreditsPerStudent
        ?? 21;

      const currentEnrollments = await prisma.enrollment.findMany({
        where: { studentId, semesterId: activeSemester.id, status: 'REGISTERED' },
        include: { course: { select: { credits: true } } },
      });
      const totalCredits = currentEnrollments.reduce((sum, e) => sum + (e.course?.credits ?? 0), 0);

      if (totalCredits + (course.credits ?? 3) > maxCredits) {
        return res.status(400).json({
          message: `Cannot enroll. Credit limit is ${maxCredits}. You have ${totalCredits} credits, and this course is ${course.credits ?? 3} credits.`,
          currentCredits: totalCredits,
          maxCredits,
        });
      }
    }

    // 6. Create enrollment record
    const semesterId = activeSemester?.id ?? group.semesterId;
    if (!semesterId) {
      return res.status(400).json({ message: 'No semester associated with this group or active semester.' });
    }
    const enrollment = await prisma.enrollment.create({
      data: {
        id: crypto.randomUUID(),
        studentId,
        groupId,
        courseId,
        semesterId,
        status: 'REGISTERED',
      },
    });

    // 7. Remove from waitlist if was on it
    await prisma.waitlistEntry.deleteMany({ where: { studentId, groupId } });

    await clearCache(CACHE_PATTERN);
    await logAudit({
      action: 'enroll_student',
      performedBy: req.user.email,
      performedById: req.user.id,
      targetType: 'enrollment',
      targetId: enrollment.id,
      details: `Student ${studentId} enrolled in group ${group.name} (${course.name})`,
    });

    res.json({
      message: 'Enrolled successfully.',
      enrollment,
      enrolledCount: enrolledCount + 1,
    });
  } catch (err) {
    console.error('Enroll error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// POST /api/v1/enroll/waitlist — join waitlist for a full group
router.post('/waitlist', authenticate, validate(waitlistSchema), async (req, res) => {
  try {
    const { courseId, groupId, studentId } = req.body;
    if (req.user.role !== 'admin' && req.user.id !== studentId) {
      return res.status(403).json({ message: 'Forbidden.' });
    }

    const group = await prisma.group.findUnique({ where: { id: groupId } });
    if (!group) return res.status(404).json({ message: 'Group not found.' });
    if (group.courseId !== courseId) {
      return res.status(400).json({ message: 'Group does not belong to this course.' });
    }

    // Check group is actually full
    const enrolledCount = await prisma.enrollment.count({
      where: { groupId, status: { in: ['REGISTERED', 'COMPLETED'] } },
    });
    if (enrolledCount < group.capacity) {
      return res.status(400).json({ message: 'Group still has available spots. Enroll directly instead.' });
    }

    // Check not already on waitlist
    const alreadyOnList = await prisma.waitlistEntry.findFirst({
      where: { studentId, groupId },
    });
    if (alreadyOnList) {
      return res.status(400).json({ message: 'Already on the waitlist for this group.' });
    }

    // Compute next position
    const maxPos = await prisma.waitlistEntry.aggregate({
      where: { groupId },
      _max: { position: true },
    });
    const nextPos = (maxPos._max.position ?? 0) + 1;

    const entry = await prisma.waitlistEntry.create({
      data: {
        id: crypto.randomUUID(),
        studentId,
        groupId,
        courseId,
        semesterId: group.semesterId ?? '',
        position: nextPos,
      },
    });

    await clearCache(CACHE_PATTERN);
    await logAudit({
      action: 'join_waitlist',
      performedBy: req.user.email,
      performedById: req.user.id,
      targetType: 'waitlist_entry',
      targetId: entry.id,
      details: `Student ${studentId} joined waitlist for group ${group.name} (position ${nextPos})`,
    });

    res.json({ message: 'Added to waitlist.', position: nextPos, entry });
  } catch (err) {
    console.error('Waitlist error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// POST /api/v1/enroll/drop — drop or withdraw from a course
router.post('/drop', authenticate, validate(dropSchema), async (req, res) => {
  try {
    const { courseId, studentId } = req.body;
    if (req.user.role !== 'admin' && req.user.id !== studentId) {
      return res.status(403).json({ message: 'Forbidden.' });
    }

    const enrollment = await prisma.enrollment.findFirst({
      where: { studentId, courseId, status: 'REGISTERED' },
      include: { semester: true, group: true, course: true },
    });
    if (!enrollment) {
      return res.status(404).json({ message: 'No active enrollment found for this course.' });
    }

    const today = todayStr();
    const sem = enrollment.semester;

    // Determine new status based on deadlines
    let newStatus;
    let statusLabel;
    if (sem?.dropDeadline && today > sem.dropDeadline && sem?.withdrawDeadline && today <= sem.withdrawDeadline) {
      newStatus = 'WITHDRAWN';
      statusLabel = 'withdrawn (W grade)';
    } else if (sem?.dropDeadline && today > sem.dropDeadline && sem?.withdrawDeadline && today > sem.withdrawDeadline) {
      return res.status(400).json({ message: `Cannot drop or withdraw. The withdraw deadline was ${sem.withdrawDeadline}.` });
    } else {
      newStatus = 'DROPPED';
      statusLabel = 'dropped';
    }

    const updated = await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: { status: newStatus, droppedAt: new Date() },
    });

    // Auto-enroll next waitlisted student if a spot opened
    const nextWaitlisted = await prisma.waitlistEntry.findFirst({
      where: { groupId: enrollment.groupId },
      orderBy: { position: 'asc' },
    });
    if (nextWaitlisted) {
      try {
        await prisma.enrollment.create({
          data: {
            id: crypto.randomUUID(),
            studentId: nextWaitlisted.studentId,
            groupId: enrollment.groupId,
            courseId: enrollment.courseId,
            semesterId: enrollment.semesterId,
            status: 'REGISTERED',
          },
        });
        await prisma.waitlistEntry.delete({ where: { id: nextWaitlisted.id } });
        console.log(`[Waitlist] Auto-enrolled student ${nextWaitlisted.studentId} into group ${enrollment.groupId}`);
      } catch (e) {
        console.error('[Waitlist] Failed to auto-enroll next student:', e.message);
      }
    }

    await clearCache(CACHE_PATTERN);
    await logAudit({
      action: `${newStatus.toLowerCase()}_course`,
      performedBy: req.user.email,
      performedById: req.user.id,
      targetType: 'enrollment',
      targetId: enrollment.id,
      details: `Student ${studentId} ${statusLabel} from ${enrollment.course?.name ?? courseId}`,
    });

    res.json({ message: `Course ${statusLabel}.`, status: newStatus });
  } catch (err) {
    console.error('Drop error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// DELETE /api/v1/enroll/:courseId — admin unenrolls student from all groups in a course
router.delete('/:courseId', authenticate, async (req, res) => {
  try {
    const { studentId } = req.body;
    const { courseId } = req.params;
    if (!studentId) return res.status(400).json({ message: 'studentId is required.' });
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden.' });
    }

    const result = await prisma.enrollment.updateMany({
      where: { studentId, courseId, status: { not: 'DROPPED' } },
      data: { status: 'DROPPED', droppedAt: new Date() },
    });

    await clearCache(CACHE_PATTERN);
    await logAudit({
      action: 'unenroll_student',
      performedBy: req.user.email,
      performedById: req.user.id,
      targetType: 'enrollment',
      targetId: courseId,
      details: `Admin removed student ${studentId} from course ${courseId}`,
    });
    res.json({ message: 'Student unenrolled.', count: result.count });
  } catch (err) {
    console.error('Unenroll error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// GET /api/v1/enroll/mine — get student's enrollments with full details
router.get('/mine', authenticate, async (req, res) => {
  try {
    const studentId = req.user.role === 'student' ? req.user.id : req.query.studentId;
    if (!studentId) return res.status(400).json({ message: 'studentId is required.' });

    const enrollments = await prisma.enrollment.findMany({
      where: { studentId, status: { not: 'DROPPED' } },
      include: {
        group: {
          include: {
            lecturer: { select: { id: true, firstName: true, lastName: true } },
            room: { select: { id: true, name: true } },
          },
        },
        course: { select: { id: true, name: true, credits: true, facultyId: true, department: true, maxStudents: true } },
        semester: { select: { id: true, name: true, year: true, isActive: true, registrationOpenDate: true, registrationCloseDate: true, dropDeadline: true, withdrawDeadline: true, maxCreditsPerStudent: true } },
      },
      orderBy: [{ enrolledAt: 'desc' }],
    });

    res.json({ enrollments, courses: [] });
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

    const result = await Promise.all(groups.map(async (g) => {
      const enrolledCount = await prisma.enrollment.count({
        where: { groupId: g.id, status: { not: 'DROPPED' } },
      });
      const waitlistCount = await prisma.waitlistEntry.count({
        where: { groupId: g.id },
      });
      const enrolledStudents = await prisma.enrollment.findMany({
        where: { groupId: g.id, status: { not: 'DROPPED' } },
        include: {
          student: { select: { id: true, firstName: true, lastName: true, email: true, studentNumber: true, year: true } },
        },
      });
      return {
        ...g,
        enrolledCount,
        waitlistCount,
        enrolledStudentIds: enrolledStudents.map((e) => e.studentId),
        enrolledStudents: enrolledStudents.map((e) => e.student),
      };
    }));

    res.json(result);
  } catch (err) {
    console.error('Get course enrollments error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// GET /api/v1/enroll/credits — get student's current credit usage for active semester
router.get('/credits', authenticate, async (req, res) => {
  try {
    const studentId = req.user.role === 'student' ? req.user.id : req.query.studentId;
    if (!studentId) return res.status(400).json({ message: 'studentId is required.' });

    const activeSemester = await prisma.semester.findFirst({ where: { isActive: 1 } });
    if (!activeSemester) {
      return res.json({ currentCredits: 0, maxCredits: 0, remainingCredits: 0, activeSemester: null });
    }

    const student = await prisma.student.findUnique({ where: { id: studentId }, select: { maxCredits: true } });
    const maxCredits = student?.maxCredits ?? activeSemester.maxCreditsPerStudent;

    const enrollments = await prisma.enrollment.findMany({
      where: { studentId, semesterId: activeSemester.id, status: 'REGISTERED' },
      include: { course: { select: { credits: true } } },
    });
    const currentCredits = enrollments.reduce((sum, e) => sum + (e.course?.credits ?? 0), 0);

    res.json({ currentCredits, maxCredits, remainingCredits: Math.max(0, maxCredits - currentCredits), activeSemester });
  } catch (err) {
    console.error('Get credits error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

// GET /api/v1/enroll/waitlist/:studentId — get student's waitlist entries
router.get('/waitlist/:studentId', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.id !== req.params.studentId) {
      return res.status(403).json({ message: 'Forbidden.' });
    }
    const entries = await prisma.waitlistEntry.findMany({
      where: { studentId: req.params.studentId },
      include: {
        group: { include: { room: { select: { name: true } } } },
        course: { select: { id: true, name: true, credits: true } },
        semester: { select: { id: true, name: true, year: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(entries);
  } catch (err) {
    console.error('Get waitlist error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

module.exports = router;
