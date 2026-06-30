const { Router } = require('express');
const prisma = require('../db');
const { generateId, logAudit } = require('../helpers');
const { authenticate } = require('../middleware/auth');
const { programCreateSchema, curriculumCreateSchema, programCourseSchema, programEnrollSchema } = require('../validation');

const router = Router();

function isAdmin(req) { return req.user?.role === 'admin'; }

// ── Programs ──

router.get('/', authenticate, async (req, res) => {
  try {
    const { facultyId } = req.query;
    const where = {};
    if (facultyId) where.facultyId = facultyId;
    const programs = await prisma.program.findMany({
      where,
      include: { faculty: { select: { id: true, name: true } }, curricula: { where: { isActive: true }, take: 1 } },
      orderBy: { name: 'asc' },
    });
    res.json(programs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch programs' });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const program = await prisma.program.findUnique({
      where: { id: req.params.id },
      include: { faculty: { select: { id: true, name: true } }, curricula: { include: { courses: { include: { course: { select: { id: true, name: true, credits: true } } } } } } },
    });
    if (!program) return res.status(404).json({ message: 'Program not found' });
    res.json(program);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch program' });
  }
});

router.post('/', authenticate, async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ message: 'Forbidden' });
  try {
    const parsed = programCreateSchema.parse(req.body);
    const program = await prisma.program.create({
      data: { id: generateId('prg'), ...parsed },
    });
    await logAudit({ action: 'create_program', performedBy: req.user.email, performedById: req.user.id, targetType: 'program', targetId: program.id, details: `Created program ${program.name}` });
    res.status(201).json(program);
  } catch (err) {
    if (err.errors) return res.status(400).json({ message: 'Validation error', errors: err.errors });
    console.error(err);
    res.status(500).json({ message: 'Failed to create program' });
  }
});

router.put('/:id', authenticate, async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ message: 'Forbidden' });
  try {
    const parsed = programCreateSchema.partial().parse(req.body);
    const program = await prisma.program.update({
      where: { id: req.params.id },
      data: parsed,
    });
    await logAudit({ action: 'update_program', performedBy: req.user.email, performedById: req.user.id, targetType: 'program', targetId: program.id, details: `Updated program ${program.name}` });
    res.json(program);
  } catch (err) {
    if (err.errors) return res.status(400).json({ message: 'Validation error', errors: err.errors });
    console.error(err);
    res.status(500).json({ message: 'Failed to update program' });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ message: 'Forbidden' });
  try {
    await prisma.program.delete({ where: { id: req.params.id } });
    await logAudit({ action: 'delete_program', performedBy: req.user.email, performedById: req.user.id, targetType: 'program', targetId: req.params.id, details: 'Deleted program' });
    res.json({ message: 'Program deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to delete program' });
  }
});

// ── Curricula ──

router.get('/:programId/curricula', authenticate, async (req, res) => {
  try {
    const curricula = await prisma.curriculum.findMany({
      where: { programId: req.params.programId },
      include: { courses: { include: { course: { select: { id: true, name: true, credits: true } } } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(curricula);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch curricula' });
  }
});

router.post('/:programId/curricula', authenticate, async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ message: 'Forbidden' });
  try {
    const parsed = curriculumCreateSchema.parse({ ...req.body, programId: req.params.programId });
    const curriculum = await prisma.curriculum.create({
      data: { id: generateId('cur'), ...parsed },
    });
    await logAudit({ action: 'create_curriculum', performedBy: req.user.email, performedById: req.user.id, targetType: 'curriculum', targetId: curriculum.id, details: `Created curriculum ${curriculum.name}` });
    res.status(201).json(curriculum);
  } catch (err) {
    if (err.errors) return res.status(400).json({ message: 'Validation error', errors: err.errors });
    console.error(err);
    res.status(500).json({ message: 'Failed to create curriculum' });
  }
});

router.put('/curricula/:id', authenticate, async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ message: 'Forbidden' });
  try {
    const parsed = curriculumCreateSchema.partial().parse(req.body);
    const curriculum = await prisma.curriculum.update({
      where: { id: req.params.id },
      data: parsed,
    });
    await logAudit({ action: 'update_curriculum', performedBy: req.user.email, performedById: req.user.id, targetType: 'curriculum', targetId: curriculum.id, details: `Updated curriculum ${curriculum.name}` });
    res.json(curriculum);
  } catch (err) {
    if (err.errors) return res.status(400).json({ message: 'Validation error', errors: err.errors });
    console.error(err);
    res.status(500).json({ message: 'Failed to update curriculum' });
  }
});

router.delete('/curricula/:id', authenticate, async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ message: 'Forbidden' });
  try {
    await prisma.curriculum.delete({ where: { id: req.params.id } });
    await logAudit({ action: 'delete_curriculum', performedBy: req.user.email, performedById: req.user.id, targetType: 'curriculum', targetId: req.params.id, details: 'Deleted curriculum' });
    res.json({ message: 'Curriculum deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to delete curriculum' });
  }
});

// ── Program Courses (curriculum course mappings) ──

router.get('/curricula/:curriculumId/courses', authenticate, async (req, res) => {
  try {
    const courses = await prisma.programCourse.findMany({
      where: { curriculumId: req.params.curriculumId },
      include: { course: { select: { id: true, name: true, code: true, credits: true } } },
      orderBy: [{ year: 'asc' }, { semester: 'asc' }],
    });
    res.json(courses);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch program courses' });
  }
});

router.post('/courses', authenticate, async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ message: 'Forbidden' });
  try {
    const parsed = programCourseSchema.parse(req.body);
    const pc = await prisma.programCourse.create({
      data: { id: generateId('pc'), ...parsed },
      include: { course: { select: { id: true, name: true, credits: true } } },
    });
    await logAudit({ action: 'add_program_course', performedBy: req.user.email, performedById: req.user.id, targetType: 'program-course', targetId: pc.id, details: `Added course to curriculum` });
    res.status(201).json(pc);
  } catch (err) {
    if (err.errors) return res.status(400).json({ message: 'Validation error', errors: err.errors });
    console.error(err);
    res.status(500).json({ message: 'Failed to add course to curriculum' });
  }
});

router.put('/courses/:id', authenticate, async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ message: 'Forbidden' });
  try {
    const parsed = programCourseSchema.partial().parse(req.body);
    const pc = await prisma.programCourse.update({
      where: { id: req.params.id },
      data: parsed,
      include: { course: { select: { id: true, name: true, credits: true } } },
    });
    res.json(pc);
  } catch (err) {
    if (err.errors) return res.status(400).json({ message: 'Validation error', errors: err.errors });
    console.error(err);
    res.status(500).json({ message: 'Failed to update program course' });
  }
});

router.delete('/courses/:id', authenticate, async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ message: 'Forbidden' });
  try {
    await prisma.programCourse.delete({ where: { id: req.params.id } });
    await logAudit({ action: 'remove_program_course', performedBy: req.user.email, performedById: req.user.id, targetType: 'program-course', targetId: req.params.id, details: 'Removed course from curriculum' });
    res.json({ message: 'Course removed from curriculum' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to remove course' });
  }
});

// ── Program Enrollments ──

router.get('/:programId/enrollments', authenticate, async (req, res) => {
  try {
    const enrollments = await prisma.programEnrollment.findMany({
      where: { programId: req.params.programId },
      include: { student: { select: { id: true, firstName: true, lastName: true, studentNumber: true, email: true } } },
      orderBy: { enrolledAt: 'desc' },
    });
    res.json(enrollments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch program enrollments' });
  }
});

router.post('/enrollments', authenticate, async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ message: 'Forbidden' });
  try {
    const parsed = programEnrollSchema.parse(req.body);
    const enrollment = await prisma.programEnrollment.create({
      data: { id: generateId('pe'), ...parsed },
      include: { student: { select: { id: true, firstName: true, lastName: true } }, program: { select: { id: true, name: true } } },
    });
    await logAudit({ action: 'enroll_program', performedBy: req.user.email, performedById: req.user.id, targetType: 'program-enrollment', targetId: enrollment.id, details: `Enrolled student in program` });
    res.status(201).json(enrollment);
  } catch (err) {
    if (err.errors) return res.status(400).json({ message: 'Validation error', errors: err.errors });
    if (err.code === 'P2002') return res.status(409).json({ message: 'Student is already enrolled in this program' });
    console.error(err);
    res.status(500).json({ message: 'Failed to enroll student' });
  }
});

router.put('/enrollments/:id', authenticate, async (req, res) => {
  if (!isAdmin(req)) return res.status(403).json({ message: 'Forbidden' });
  try {
    const { status } = req.body;
    const enrollment = await prisma.programEnrollment.update({
      where: { id: req.params.id },
      data: { status },
    });
    res.json(enrollment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update enrollment' });
  }
});

// ── Student's program ──

router.get('/student/:studentId/program', authenticate, async (req, res) => {
  try {
    const enrollment = await prisma.programEnrollment.findFirst({
      where: { studentId: req.params.studentId, status: 'active' },
      include: {
        program: {
          include: {
            curricula: { where: { isActive: true }, include: { courses: { include: { course: { select: { id: true, name: true, credits: true } } } } }, take: 1 },
          },
        },
        curriculum: { include: { courses: { include: { course: { select: { id: true, name: true, credits: true } } } } } },
      },
    });
    if (!enrollment) return res.json(null);
    res.json(enrollment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch student program' });
  }
});

module.exports = router;
