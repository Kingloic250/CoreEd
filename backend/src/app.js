require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const authRoutes = require('./routes/auth');
const verifyRoutes = require('./routes/verify');
const accountRequestRoutes = require('./routes/accountRequests');
const studentRoutes = require('./routes/students');
const departmentRoutes = require('./routes/departments');
const lecturerRoutes = require('./routes/lecturers');
const facultyRoutes = require('./routes/faculties');
const courseRoutes = require('./routes/courses');
const semesterRoutes = require('./routes/semesters');
const profileRoutes = require('./routes/profile');
const assignmentRoutes = require('./routes/assignments');
const materialRoutes = require('./routes/materials');
const uploadRoutes = require('./routes/upload');
const auditLogRoutes = require('./routes/auditLogs');
const calendarEventRoutes = require('./routes/calendarEvents');
const userRoutes = require('./routes/users');
const reportRoutes = require('./routes/reports');
const announcementRoutes = require('./routes/announcements');
const roomRoutes = require('./routes/rooms');
const timetableRoutes = require('./routes/timetable');
const groupRoutes = require('./routes/groups');
const enrollRoutes = require('./routes/enroll');
const gradeRoutes = require('./routes/grades');
const claimRoutes = require('./routes/claims');
const examRoutes = require('./routes/exams');
const { authenticate } = require('./middleware/auth');
const { createRateLimiter } = require('./middleware/rateLimit');

const app = express();

const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

app.use(helmet());
app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
app.use(morgan('dev'));
app.use(express.json());

const globalLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 100, keyPrefix: 'global' });
const authLimiter = createRateLimiter({ windowMs: 60 * 1000, max: 5, keyPrefix: 'auth', lockoutAttempts: 5, lockoutDurationMs: 5 * 60 * 1000 });
const verifyLimiter = createRateLimiter({ windowMs: 60 * 1000, max: 3, keyPrefix: 'verify' });

app.use(globalLimiter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1/verify', verifyLimiter, verifyRoutes);
app.use('/api/v1/account-requests', accountRequestRoutes);
app.use('/api/v1/students', studentRoutes);
app.use('/api/v1/departments', departmentRoutes);
app.use('/api/v1/lecturers', lecturerRoutes);
app.use('/api/v1/faculties', facultyRoutes);
app.use('/api/v1/courses', courseRoutes);
app.use('/api/v1/semesters', semesterRoutes);
app.use('/api/v1/profile', authenticate, profileRoutes);
app.use('/api/v1/assignments', assignmentRoutes);
app.use('/api/v1/materials', materialRoutes);
app.use('/api/v1/upload', authenticate, uploadRoutes);
app.use('/api/v1/audit-logs', authenticate, auditLogRoutes);
app.use('/api/v1/calendar-events', authenticate, calendarEventRoutes);
app.use('/api/v1/users', authenticate, userRoutes);
app.use('/api/v1/reports', authenticate, reportRoutes);
app.use('/api/v1/announcements', authenticate, announcementRoutes);
app.use('/api/v1/rooms', authenticate, roomRoutes);
app.use('/api/v1/timetable', authenticate, timetableRoutes);
app.use('/api/v1/groups', authenticate, groupRoutes);
app.use('/api/v1/enroll', authenticate, enrollRoutes);
app.use('/api/v1/grades', authenticate, gradeRoutes);
app.use('/api/v1/claims', authenticate, claimRoutes);
app.use('/api/v1/exams', authenticate, examRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: 'File too large.' });
  }
  if (err.message && err.message.startsWith('File type')) {
    return res.status(400).json({ message: err.message });
  }
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
  });
});

module.exports = app;
