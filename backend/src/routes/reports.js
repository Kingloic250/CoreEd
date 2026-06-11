const { Router } = require('express');
const prisma = require('../db');
const { authenticate } = require('../middleware/auth');
const { cache } = require('../middleware/cache');

const router = Router();

function getGradeRange(score) {
  if (score >= 90) return '90-100';
  if (score >= 75) return '75-89';
  if (score >= 60) return '60-74';
  if (score >= 50) return '50-59';
  return '0-49';
}

router.get('/overview', authenticate, cache(120), async (req, res) => {
  try {
    const [totalStudents, totalCourses, totalLecturers, totalDepartments] = await Promise.all([
      prisma.student.count(),
      prisma.course.count(),
      prisma.lecturer.count(),
      prisma.department.count(),
    ]);
    res.json({ totalStudents, totalCourses, totalLecturers, totalDepartments });
  } catch (err) {
    console.error('Reports overview error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

router.get('/attendance-summary', authenticate, cache(120), async (req, res) => {
  try {
    const courses = await prisma.course.findMany({ select: { id: true, name: true } });
    const attendanceRecords = await prisma.attendance.groupBy({
      by: ['courseId', 'status'],
      _count: { id: true },
    });

    const summary = courses.map((course) => {
      const courseRecords = attendanceRecords.filter((r) => r.courseId === course.id);
      const present = courseRecords.find((r) => r.status === 'present')?._count.id ?? 0;
      const total = courseRecords.reduce((sum, r) => sum + r._count.id, 0);
      return {
        courseId: course.id,
        name: course.name,
        rate: total > 0 ? Math.round((present / total) * 100) : 0,
        present,
        total,
      };
    });

    res.json(summary);
  } catch (err) {
    console.error('Attendance summary error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

router.get('/grade-distribution', authenticate, cache(120), async (req, res) => {
  try {
    const grades = await prisma.grade.findMany({ select: { score: true } });

    const distribution = {
      '90-100': 0,
      '75-89': 0,
      '60-74': 0,
      '50-59': 0,
      '0-49': 0,
    };

    grades.forEach((g) => {
      const range = getGradeRange(g.score);
      distribution[range] = (distribution[range] ?? 0) + 1;
    });

    const result = Object.entries(distribution).map(([range, count]) => ({ range, count }));
    res.json(result);
  } catch (err) {
    console.error('Grade distribution error:', err);
    res.status(500).json({ message: 'Internal server error.' });
  }
});

module.exports = router;