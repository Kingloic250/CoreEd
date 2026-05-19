require('dotenv').config();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const prisma = require('./db');

const DATA_DIR = path.join(__dirname, '..', '..', 'frontend', 'src', 'mock', 'data');

function load(filename) {
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) {
    console.warn(`  ⚠  ${filename} not found, skipping`);
    return [];
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

async function main() {
  console.log('🌱 Seeding database...\n');

  // ── Users ─────────────────────────────────────────────
  console.log('  Seeding users...');
  const rawUsers = load('users.json');
  for (const u of rawUsers) {
    const hash = await bcrypt.hash(u.password, 10);
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { id: u.id, name: u.name, email: u.email, password: hash, role: u.role, avatar: u.avatar ?? null },
    });
  }
  console.log(`  ✓ ${rawUsers.length} users`);

  // ── Students ──────────────────────────────────────────
  console.log('  Seeding students...');
  const rawStudents = load('students.json');
  for (const s of rawStudents) {
    await prisma.student.upsert({
      where: { id: s.id },
      update: {},
      create: {
        id: s.id,
        firstName: s.firstName,
        lastName: s.lastName,
        email: s.email,
        dateOfBirth: s.dateOfBirth ?? null,
        gender: s.gender ?? null,
        year: s.year,
        enrollmentDate: s.enrollmentDate ?? null,
        status: s.status ?? 'active',
        studentNumber: s.studentNumber ?? null,
      },
    });
  }
  console.log(`  ✓ ${rawStudents.length} students`);

  // ── Lecturers ─────────────────────────────────────────
  console.log('  Seeding lecturers...');
  const rawLecturers = load('lecturers.json');
  for (const l of rawLecturers) {
    await prisma.lecturer.upsert({
      where: { id: l.id },
      update: {},
      create: {
        id: l.id,
        firstName: l.firstName,
        lastName: l.lastName,
        email: l.email,
        department: l.department ?? null,
        assignedCourses: l.assignedCourses ?? [],
        qualification: l.qualification ?? null,
        joinDate: l.joinDate ?? null,
      },
    });
  }
  console.log(`  ✓ ${rawLecturers.length} lecturers`);

  // ── Departments ────────────────────────────────────────
  console.log('  Seeding departments...');
  const rawDepts = load('departments.json');
  for (const d of rawDepts) {
    await prisma.department.upsert({
      where: { id: d.id },
      update: {},
      create: { id: d.id, name: d.name, code: d.code ?? null, headLecturerId: d.headLecturerId ?? null, description: d.description ?? null },
    });
  }
  console.log(`  ✓ ${rawDepts.length} departments`);

  // ── Semesters ──────────────────────────────────────────
  console.log('  Seeding semesters...');
  const rawSemesters = load('semesters.json');
  for (const s of rawSemesters) {
    await prisma.semester.upsert({
      where: { id: s.id },
      update: {},
      create: {
        id: s.id,
        name: s.name,
        year: s.year ?? null,
        startDate: s.startDate ?? null,
        endDate: s.endDate ?? null,
        isActive: s.isActive ? 1 : 0,
      },
    });
  }
  console.log(`  ✓ ${rawSemesters.length} semesters`);

  // ── Courses ────────────────────────────────────────────
  console.log('  Seeding courses...');
  const rawCourses = load('courses.json');
  for (const c of rawCourses) {
    await prisma.course.upsert({
      where: { id: c.id },
      update: {},
      create: {
        id: c.id,
        name: c.name,
        year: c.year ?? null,
        department: c.department ?? null,
        lecturerId: c.lecturerId ?? null,
        semesterId: c.semesterId ?? null,
        credits: c.credits ?? 3,
        room: c.room ?? null,
        schedule: c.schedule ?? [],
        studentIds: c.studentIds ?? [],
        gradingComponents: c.gradingComponents ?? [],
      },
    });
  }
  console.log(`  ✓ ${rawCourses.length} courses`);

  // ── Attendance ─────────────────────────────────────────
  console.log('  Seeding attendance...');
  const rawAttendance = load('attendance.json');
  for (const a of rawAttendance) {
    await prisma.attendance.upsert({
      where: { id: a.id },
      update: {},
      create: {
        id: a.id,
        courseId: a.courseId ?? null,
        studentId: a.studentId ?? null,
        date: a.date ?? null,
        status: a.status ?? 'present',
        markedBy: a.markedBy ?? null,
      },
    });
  }
  console.log(`  ✓ ${rawAttendance.length} records`);

  // ── Grades ─────────────────────────────────────────────
  console.log('  Seeding grades...');
  const rawGrades = load('grades.json');
  for (const g of rawGrades) {
    await prisma.grade.upsert({
      where: { id: g.id },
      update: {},
      create: {
        id: g.id,
        studentId: g.studentId ?? null,
        courseId: g.courseId ?? null,
        semester: g.semester ?? null,
        score: g.score ?? 0,
        maxScore: g.maxScore ?? 100,
        grade: g.grade ?? null,
        comments: g.comments ?? null,
        componentScores: g.componentScores ?? {},
      },
    });
  }
  console.log(`  ✓ ${rawGrades.length} grades`);

  // ── Announcements ──────────────────────────────────────
  console.log('  Seeding announcements...');
  const rawAnnouncements = load('announcements.json');
  for (const a of rawAnnouncements) {
    await prisma.announcement.upsert({
      where: { id: a.id },
      update: {},
      create: {
        id: a.id,
        title: a.title,
        body: a.body ?? null,
        targetRoles: a.targetRoles ?? [],
        createdBy: a.createdBy ?? null,
        priority: a.priority ?? 'normal',
      },
    });
  }
  console.log(`  ✓ ${rawAnnouncements.length} announcements`);

  // ── Account Requests ───────────────────────────────────
  console.log('  Seeding account requests...');
  const rawRequests = load('account_requests.json');
  for (const r of rawRequests) {
    // Only set schoolEmail if the referenced user exists
    const schoolEmail = r.schoolEmail ?? null;
    const existingUser = schoolEmail ? await prisma.user.findUnique({ where: { email: schoolEmail } }) : null;
    await prisma.accountRequest.upsert({
      where: { id: r.id },
      update: {},
      create: {
        id: r.id,
        name: r.name ?? null,
        email: r.email ?? null,
        classOrSubject: r.classOrSubject ?? null,
        message: r.message ?? null,
        status: r.status ?? 'pending',
        schoolEmail: existingUser ? schoolEmail : null,
        password: r.password ?? null,
      },
    });
  }
  console.log(`  ✓ ${rawRequests.length} requests`);

  // ── Audit Logs ─────────────────────────────────────────
  console.log('  Seeding audit logs...');
  const rawLogs = load('audit_logs.json');
  for (const l of rawLogs) {
    await prisma.auditLog.upsert({
      where: { id: l.id },
      update: {},
      create: {
        id: l.id,
        action: l.action ?? null,
        performedBy: l.performedBy ?? null,
        performedById: l.performedById ?? null,
        targetType: l.targetType ?? null,
        targetId: l.targetId ?? null,
        details: l.details ?? null,
      },
    });
  }
  console.log(`  ✓ ${rawLogs.length} logs`);

  // ── Assignments ────────────────────────────────────────
  console.log('  Seeding assignments...');
  const rawAssignments = load('assignments.json');
  for (const a of rawAssignments) {
    const { submissions, ...assignment } = a;
    await prisma.assignment.upsert({
      where: { id: assignment.id },
      update: {},
      create: {
        id: assignment.id,
        courseId: assignment.courseId ?? null,
        courseName: assignment.courseName ?? null,
        title: assignment.title,
        description: assignment.description ?? null,
        dueDate: assignment.dueDate ?? null,
        maxScore: assignment.maxScore ?? 100,
        attachments: assignment.attachments ?? [],
        createdBy: assignment.createdBy ?? null,
      },
    });
      // Insert submissions
    if (submissions && submissions.length > 0) {
      for (const sub of submissions) {
        const subId = `sub_${assignment.id}_${sub.studentId}`;
        await prisma.assignmentSubmission.upsert({
          where: { id: subId },
          update: {},
          create: {
            id: subId,
            assignmentId: assignment.id,
            studentId: sub.studentId ?? null,
            submittedAt: sub.submittedAt ? new Date(sub.submittedAt) : null,
            fileUrl: sub.fileUrl ?? null,
            content: sub.content ?? null,
            status: sub.status ?? 'pending',
            score: sub.score ?? null,
            feedback: sub.feedback ?? null,
            gradedAt: sub.gradedAt ? new Date(sub.gradedAt) : null,
          },
        });
      }
    }
  }
  console.log(`  ✓ ${rawAssignments.length} assignments`);

  // ── Calendar Events ────────────────────────────────────
  console.log('  Seeding calendar events...');
  const rawEvents = load('events.json');
  for (const e of rawEvents) {
    await prisma.calendarEvent.upsert({
      where: { id: e.id },
      update: {},
      create: {
        id: e.id,
        title: e.title,
        description: e.description ?? null,
        type: e.type ?? 'event',
        date: e.date ?? null,
        time: e.time ?? null,
        endTime: e.endTime ?? null,
        courseId: e.courseId ?? null,
        courseName: e.courseName ?? null,
        targetRoles: e.targetRoles ?? [],
        createdBy: e.createdBy ?? null,
      },
    });
  }
  console.log(`  ✓ ${rawEvents.length} events`);

  // ── Materials ──────────────────────────────────────────
  console.log('  Seeding materials...');
  const rawMaterials = load('materials.json');
  for (const m of rawMaterials) {
    await prisma.courseMaterial.upsert({
      where: { id: m.id },
      update: {},
      create: {
        id: m.id,
        title: m.title,
        type: m.type ?? 'reading',
        courseId: m.courseId ?? null,
        courseName: m.courseName ?? null,
        fileName: m.fileName ?? null,
        description: m.description ?? null,
        uploadedBy: m.uploadedBy ?? null,
      },
    });
  }
  console.log(`  ✓ ${rawMaterials.length} materials`);

  // ── Claims ─────────────────────────────────────────────
  console.log('  Seeding claims...');
  const rawClaims = load('claims.json');
  for (const c of rawClaims) {
    await prisma.claim.upsert({
      where: { id: c.id },
      update: {},
      create: {
        id: c.id,
        gradeId: c.gradeId ?? null,
        studentId: c.studentId ?? null,
        subject: c.subject ?? null,
        semester: c.semester ?? null,
        claimedGrade: c.claimedGrade ?? null,
        reason: c.reason ?? null,
        status: c.status ?? 'pending',
        resolvedAt: c.resolvedAt ? new Date(c.resolvedAt) : null,
        resolvedBy: c.resolvedBy ?? null,
        resolutionNote: c.resolutionNote ?? null,
      },
    });
  }
  console.log(`  ✓ ${rawClaims.length} claims`);

  // ── Invoices ───────────────────────────────────────────
  console.log('  Seeding invoices...');
  const rawInvoices = load('invoices.json');
  for (const inv of rawInvoices) {
    const { items, ...invoice } = inv;
    await prisma.invoice.upsert({
      where: { id: invoice.id },
      update: {},
      create: {
        id: invoice.id,
        studentId: invoice.studentId ?? null,
        studentName: invoice.studentName ?? null,
        totalAmount: invoice.totalAmount ?? 0,
        dueDate: invoice.dueDate ?? null,
        status: invoice.status ?? 'pending',
        semester: invoice.semester ?? null,
        academicYear: invoice.academicYear ?? null,
      },
    });
    if (items && items.length > 0) {
      for (let idx = 0; idx < items.length; idx++) {
        const item = items[idx];
        const itemId = `item_${invoice.id}_${idx}`;
        await prisma.invoiceItem.upsert({
          where: { id: itemId },
          update: {},
          create: {
            id: itemId,
            invoiceId: invoice.id,
            description: item.description ?? null,
            amount: item.amount ?? 0,
          },
        });
      }
    }
  }
  console.log(`  ✓ ${rawInvoices.length} invoices`);

  // ── Payments ───────────────────────────────────────────
  console.log('  Seeding payments...');
  const rawPayments = load('payments.json');
  for (const p of rawPayments) {
    await prisma.payment.upsert({
      where: { id: p.id },
      update: {},
      create: {
        id: p.id,
        invoiceId: p.invoiceId ?? null,
        amount: p.amount ?? 0,
        method: p.method ?? 'bank_transfer',
        reference: p.reference ?? null,
        paidAt: p.paidAt ? new Date(p.paidAt) : null,
        receivedBy: p.receivedBy ?? null,
      },
    });
  }
  console.log(`  ✓ ${rawPayments.length} payments`);

  // ── Messages ───────────────────────────────────────────
  console.log('  Seeding messages...');
  const rawMessages = load('messages.json');
  for (const m of rawMessages) {
    await prisma.message.upsert({
      where: { id: m.id },
      update: {},
      create: {
        id: m.id,
        senderId: m.senderId ?? null,
        senderName: m.senderName ?? null,
        senderRole: m.senderRole ?? null,
        recipientId: m.recipientId ?? null,
        recipientName: m.recipientName ?? null,
        recipientRole: m.recipientRole ?? null,
        subject: m.subject ?? null,
        body: m.body ?? null,
        read: m.read ?? false,
        parentId: m.parentId ?? null,
      },
    });
  }
  console.log(`  ✓ ${rawMessages.length} messages`);

  console.log('\n✅ Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
