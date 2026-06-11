export const ROLES = {
  ADMIN: 'admin',
  LECTURER: 'lecturer',
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
  ADMIN_LECTURERS: '/admin/lecturers',
  ADMIN_COURSES: '/admin/courses',
  ADMIN_NOTIFICATIONS: '/admin/notifications',
  ADMIN_PROFILE: '/admin/profile',
  ADMIN_REQUESTS: '/admin/requests',
  ADMIN_SETTINGS: '/admin/settings',
  ADMIN_DEPARTMENTS: '/admin/departments',
  ADMIN_SEMESTERS: '/admin/semesters',
  ADMIN_ENROLLMENT: '/admin/enrollment',
  ADMIN_AUDIT_LOGS: '/admin/audit-logs',
  ADMIN_USERS: '/admin/users',
  ADMIN_TIMETABLE: '/admin/timetable',
  ADMIN_REPORTS: '/admin/reports',
  LECTURER_NOTIFICATIONS: '/lecturer/notifications',
  STUDENT_NOTIFICATIONS: '/student/notifications',
  LECTURER: '/lecturer',
  LECTURER_COURSES: '/lecturer/courses',
  LECTURER_ATTENDANCE: '/lecturer/attendance',
  LECTURER_GRADES: '/lecturer/grades',
  STUDENT: '/student',
  STUDENT_ATTENDANCE: '/student/attendance',
  STUDENT_GRADES: '/student/grades',
  STUDENT_TRANSCRIPT: '/student/transcript',
  STUDENT_ANNOUNCEMENTS: '/student/announcements',
  STUDENT_COURSES: '/student/courses',
} as const;

export const API_PATHS = {
  LOGIN: '/api/v1/auth/login',
  LOGOUT: '/api/v1/auth/logout',
  STUDENTS: '/api/v1/students',
  LECTURERS: '/api/v1/lecturers',
  COURSES: '/api/v1/courses',
  ATTENDANCE: '/api/v1/attendance',
  GRADES: '/api/v1/grades',
  ANNOUNCEMENTS: '/api/v1/announcements',
  ACCOUNT_REQUESTS: '/api/v1/account-requests',
  PROFILE: '/api/v1/profile',
  CHANGE_PASSWORD: '/api/v1/auth/change-password',
  DEPARTMENTS: '/api/v1/departments',
  SEMESTERS: '/api/v1/semesters',
  AUDIT_LOGS: '/api/v1/audit-logs',
  USERS: '/api/v1/users',
  ASSIGNMENTS: '/api/v1/assignments',
  CALENDAR_EVENTS: '/api/v1/calendar-events',
  MATERIALS: '/api/v1/materials',
  CLAIMS: '/api/v1/claims',
  FEES: '/api/v1/fees',
  INVOICES: '/api/v1/invoices',
  PAYMENTS: '/api/v1/payments',
  MESSAGES: '/api/v1/messages',
  ROOMS: '/api/v1/rooms',
  TIMETABLE: '/api/v1/timetable',
} as const;

export const QUERY_KEYS = {
  STUDENTS: 'students',
  LECTURERS: 'lecturers',
  COURSES: 'courses',
  ATTENDANCE: 'attendance',
  GRADES: 'grades',
  ANNOUNCEMENTS: 'announcements',
  ACCOUNT_REQUESTS: 'account-requests',
  DEPARTMENTS: 'departments',
  SEMESTERS: 'semesters',
  AUDIT_LOGS: 'audit-logs',
  USERS: 'users',
  ASSIGNMENTS: 'assignments',
  CALENDAR_EVENTS: 'calendar-events',
  MATERIALS: 'materials',
  CLAIMS: 'claims',
  FEES: 'fees',
  INVOICES: 'invoices',
  PAYMENTS: 'payments',
  MESSAGES: 'messages',
  ROOMS: 'rooms',
  TIMETABLE: 'timetable',
} as const;

export const GRADE_SCALE = [
  { min: 90, max: 100, letter: 'A', color: 'text-emerald-600' },
  { min: 75, max: 89, letter: 'B', color: 'text-blue-600' },
  { min: 60, max: 74, letter: 'C', color: 'text-yellow-600' },
  { min: 50, max: 59, letter: 'D', color: 'text-orange-600' },
  { min: 0, max: 49, letter: 'F', color: 'text-destructive' },
] as const;

export const ATTENDANCE_STATUSES = ['present', 'absent'] as const;
export type AttendanceStatus = typeof ATTENDANCE_STATUSES[number];

export const SEMESTERS = ['Semester 1', 'Semester 2', 'Summer'] as const;
export type Semester = typeof SEMESTERS[number];

export const YEARS = ['Year 1', 'Year 2', 'Year 3', 'Year 4'] as const;

export const DEPARTMENTS = [
  'Mathematics',
  'English',
  'Physics',
  'Chemistry',
  'Biology',
  'History',
  'Geography',
  'Computer Science',
  'French',
] as const;
