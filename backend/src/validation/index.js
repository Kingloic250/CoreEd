const { z } = require('zod');

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

const studentCreateSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['male', 'female']).optional(),
  year: z.string().min(1, 'Year is required'),
  facultyId: z.string().min(1, 'Faculty is required'),
});

const studentUpdateSchema = z.object({
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  email: z.string().email().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['male', 'female']).optional(),
  year: z.string().optional(),
  facultyId: z.string().optional(),
  department: z.string().optional(),
  status: z.enum(['active', 'inactive', 'graduated', 'suspended']).optional(),
});

const lecturerCreateSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  department: z.string().optional(),
  qualification: z.string().optional(),
  joinDate: z.string().optional(),
});

const departmentCreateSchema = z.object({
  name: z.string().min(1, 'Department name is required'),
  code: z.string().optional(),
  headLecturerId: z.string().optional(),
  description: z.string().optional(),
});

const facultyCreateSchema = z.object({
  name: z.string().min(1, 'Faculty name is required'),
  code: z.string().optional(),
  departmentId: z.string().min(1, 'Department is required'),
  description: z.string().optional(),
});

const courseCreateSchema = z.object({
  name: z.string().min(2, 'Course name must be at least 2 characters'),
  year: z.string().min(1, 'Year is required'),
  facultyId: z.string().min(1, 'Faculty is required'),
  lecturerId: z.string().min(1, 'Lecturer is required'),
  credits: z.number().int().min(1).max(20).optional(),
  roomId: z.string().optional(),
  maxStudents: z.coerce.number().int().min(1).optional(),
});

const semesterCreateSchema = z.object({
  name: z.enum(['Semester 1', 'Semester 2', 'Summer']),
  year: z.string().min(1, 'Academic year is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  registrationOpenDate: z.string().optional(),
  registrationCloseDate: z.string().optional(),
  dropDeadline: z.string().optional(),
  withdrawDeadline: z.string().optional(),
  maxCreditsPerStudent: z.coerce.number().int().min(1).max(30).optional(),
});

const enrollSchema = z.object({
  courseId: z.string().min(1, 'Course is required'),
  groupId: z.string().min(1, 'Group is required'),
  studentId: z.string().min(1, 'Student is required'),
});

const waitlistSchema = z.object({
  courseId: z.string().min(1, 'Course is required'),
  groupId: z.string().min(1, 'Group is required'),
  studentId: z.string().min(1, 'Student is required'),
});

const dropSchema = z.object({
  courseId: z.string().min(1, 'Course is required'),
  studentId: z.string().min(1, 'Student is required'),
});

const accountRequestSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Please enter a valid email address'),
  studentId: z.string().min(1, 'Student ID is required'),
  classOrSubject: z.string().optional(),
  message: z.string().optional(),
});

const approveRequestSchema = z.object({
  schoolEmail: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

const userUpdateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  role: z.enum(['admin', 'lecturer', 'student']),
});

const userResetPasswordSchema = z.object({
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

const calendarEventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  type: z.enum(['exam', 'deadline', 'holiday', 'event']),
  date: z.string().min(1, 'Date is required'),
  time: z.string().nullable().optional(),
  endTime: z.string().nullable().optional(),
  courseName: z.string().nullable().optional(),
  targetRoles: z.array(z.string()).optional(),
});

const groupCreateSchema = z.object({
  name: z.string().min(1, 'Group name is required'),
  courseId: z.string().min(1, 'Course is required'),
  semesterId: z.string().optional(),
  lecturerId: z.string().optional(),
  roomId: z.string().optional(),
  capacity: z.number().int().min(1).default(30),
  schedule: z.array(z.object({
    day: z.number().min(0).max(6),
    startTime: z.string(),
    endTime: z.string(),
    roomId: z.string().optional(),
  })).optional().default([]),
});

const gradeCreateSchema = z.object({
  studentId: z.string().min(1, 'Student is required'),
  courseId: z.string().min(1, 'Course is required'),
  groupId: z.string().optional(),
  semester: z.string().optional(),
  score: z.number().min(0).default(0),
  maxScore: z.number().min(1).default(100),
  grade: z.string().optional(),
  comments: z.string().optional(),
  componentScores: z.record(z.number()).optional(),
});

const gradeReviewSchema = z.object({
  rejectionNote: z.string().optional(),
});

const examCreateSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  courseId: z.string().min(1, 'Course is required'),
  groupId: z.string().optional(),
  lecturerId: z.string().optional(),
  roomId: z.string().nullable().optional(),
  date: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  maxScore: z.number().min(1).default(100),
  type: z.enum(['midterm', 'final', 'quiz', 'other']).default('exam'),
  gradingComponent: z.string().nullable().optional(),
});

const examResultSchema = z.object({
  studentId: z.string().min(1, 'Student is required'),
  score: z.number().min(0, 'Score must be 0 or more'),
  comments: z.string().optional(),
});

module.exports = {
  loginSchema,
  studentCreateSchema,
  studentUpdateSchema,
  lecturerCreateSchema,
  departmentCreateSchema,
  facultyCreateSchema,
  courseCreateSchema,
  semesterCreateSchema,
  enrollSchema,
  waitlistSchema,
  dropSchema,
  accountRequestSchema,
  approveRequestSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  userUpdateSchema,
  userResetPasswordSchema,
  calendarEventSchema,
  groupCreateSchema,
  gradeCreateSchema,
  gradeReviewSchema,
  examCreateSchema,
  examResultSchema,
};
