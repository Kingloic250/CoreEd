// App-wide constants: roles, route paths, API base paths

export const ROLES = {
  ADMIN: 'admin',
  TEACHER: 'teacher',
  STUDENT: 'student',
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

export const ROUTES = {
  ROOT: '/',
  LOGIN: '/login',
  CONTACT_ADMIN: '/contact-admin',
  UNAUTHORIZED: '/unauthorized',
  ADMIN: '/admin',
  ADMIN_STUDENTS: '/admin/students',
  ADMIN_TEACHERS: '/admin/teachers',
  ADMIN_CLASSES: '/admin/classes',
  ADMIN_NOTIFICATIONS: '/admin/notifications',
  ADMIN_REQUESTS: '/admin/requests',
  ADMIN_SETTINGS: '/admin/settings',
  ADMIN_REPORTS: '/admin/reports',
  TEACHER_NOTIFICATIONS: '/teacher/notifications',
  STUDENT_NOTIFICATIONS: '/student/notifications',
  TEACHER: '/teacher',
  TEACHER_CLASSES: '/teacher/classes',
  TEACHER_ATTENDANCE: '/teacher/attendance',
  TEACHER_GRADES: '/teacher/grades',
  STUDENT: '/student',
  STUDENT_ATTENDANCE: '/student/attendance',
  STUDENT_GRADES: '/student/grades',
  STUDENT_TRANSCRIPT: '/student/transcript',
  STUDENT_ANNOUNCEMENTS: '/student/announcements',
} as const;

export const API_PATHS = {
  LOGIN: '/api/v1/auth/login',
  LOGOUT: '/api/v1/auth/logout',
  STUDENTS: '/api/v1/students',
  TEACHERS: '/api/v1/teachers',
  CLASSES: '/api/v1/classes',
  ATTENDANCE: '/api/v1/attendance',
  GRADES: '/api/v1/grades',
  ANNOUNCEMENTS: '/api/v1/announcements',
  ACCOUNT_REQUESTS: '/api/v1/account-requests',
} as const;

export const QUERY_KEYS = {
  STUDENTS: 'students',
  TEACHERS: 'teachers',
  CLASSES: 'classes',
  ATTENDANCE: 'attendance',
  GRADES: 'grades',
  ANNOUNCEMENTS: 'announcements',
  ACCOUNT_REQUESTS: 'account-requests',
} as const;

export const GRADE_SCALE = [
  { min: 90, max: 100, letter: 'A', color: 'text-emerald-600' },
  { min: 75, max: 89, letter: 'B', color: 'text-blue-600' },
  { min: 60, max: 74, letter: 'C', color: 'text-yellow-600' },
  { min: 50, max: 59, letter: 'D', color: 'text-orange-600' },
  { min: 0, max: 49, letter: 'F', color: 'text-destructive' },
] as const;

export const ATTENDANCE_STATUSES = ['present', 'absent', 'late', 'excused'] as const;
export type AttendanceStatus = typeof ATTENDANCE_STATUSES[number];

export const TERMS = ['Term 1', 'Term 2', 'Term 3'] as const;
export type Term = typeof TERMS[number];

export const GRADE_LEVELS = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6'] as const;

export const SUBJECTS = [
  'Mathematics',
  'English',
  'Physics',
  'Chemistry',
  'Biology',
  'History',
  'Geography',
  'Computer Science',
  'Kinyarwanda',
  'French',
] as const;
