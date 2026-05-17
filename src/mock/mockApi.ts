import axiosInstance from '@/api/axiosInstance';
import users from './data/users.json';
import studentsData from './data/students.json';
import lecturersData from './data/lecturers.json';
import coursesData from './data/courses.json';
import attendanceData from './data/attendance.json';
import gradesData from './data/grades.json';
import announcementsData from './data/announcements.json';
import departmentsData from './data/departments.json';
import semestersData from './data/semesters.json';
import accountRequestsData from './data/account_requests.json';
import auditLogsData from './data/audit_logs.json';
import { getToken } from '@/utils/tokenManager';

let students = [...studentsData] as Record<string, unknown>[];
let lecturers = [...lecturersData] as Record<string, unknown>[];
let courses = [...coursesData] as Record<string, unknown>[];
let attendance = [...attendanceData] as Record<string, unknown>[];
let grades = [...gradesData] as Record<string, unknown>[];
let announcements = [...announcementsData] as Record<string, unknown>[];
let departments = [...departmentsData] as Record<string, unknown>[];
let semesters = [...semestersData] as Record<string, unknown>[];
let auditLogs = [...auditLogsData] as Record<string, unknown>[];

const generateId = (prefix: string) => `${prefix}${Date.now()}`;

export function setupMockApi() {
  if (import.meta.env.VITE_MOCK_API !== 'true') return;

  import('axios-mock-adapter').then(({ default: MockAdapter }) => {
    const mock = new MockAdapter(axiosInstance, { delayResponse: 400, onNoMatch: 'passthrough' });

    // ─── AUTH ─────────────────────────────────────────────────────────────
    mock.onPost('/api/v1/auth/login').reply((config) => {
      const { email, password } = JSON.parse(config.data);
      const user = (users as unknown as Record<string, string>[]).find(
        (u) => u.email === email && u.password === password
      );
      if (!user) {
        return [401, { message: 'Invalid email or password' }];
      }
      const token = `mock.jwt.token_${user.role}`;
      return [200, { token, user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar } }];
    });

    mock.onPost('/api/v1/auth/logout').reply(200, { message: 'Logged out' });

    mock.onPost('/api/v1/auth/change-password').reply((config) => {
      const { currentPassword, newPassword } = JSON.parse(config.data);
      const token = getToken();
      const user = (users as unknown as Record<string, string>[]).find(
        (u) => `mock.jwt.token_${u.role}` === token
      );
      if (!user || user.password !== currentPassword) {
        return [400, { message: 'Current password is incorrect' }];
      }
      user.password = newPassword;
      return [200, { message: 'Password changed successfully' }];
    });

    // ─── PROFILE ─────────────────────────────────────────────────────────
    mock.onGet('/api/v1/profile').reply(() => {
      const token = getToken();
      const user = (users as unknown as Record<string, string>[]).find(
        (u) => `mock.jwt.token_${u.role}` === token
      );
      if (!user) return [401, { message: 'Unauthorized' }];
      return [200, { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar }];
    });

    mock.onPut('/api/v1/profile').reply((config) => {
      const { name, email } = JSON.parse(config.data);
      const token = getToken();
      const user = (users as unknown as Record<string, string>[]).find(
        (u) => `mock.jwt.token_${u.role}` === token
      );
      if (!user) return [401, { message: 'Unauthorized' }];
      if (name) user.name = name;
      if (email) user.email = email;
      return [200, { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar }];
    });

    // ─── STUDENTS ─────────────────────────────────────────────────────────
    mock.onGet('/api/v1/students').reply((config) => {
      const search = (config.params?.search ?? '').toLowerCase();
      const filtered = search
        ? students.filter((s) =>
            `${s.firstName} ${s.lastName}`.toLowerCase().includes(search) ||
            (s.year as string).toLowerCase().includes(search)
          )
        : students;
      return [200, filtered];
    });

    mock.onGet(/\/api\/v1\/students\/\w+/).reply((config) => {
      const id = config.url?.split('/').pop();
      const student = students.find((s) => s.id === id);
      return student ? [200, student] : [404, { message: 'Student not found' }];
    });

    mock.onPost('/api/v1/students').reply((config) => {
      const payload = JSON.parse(config.data);
      const newStudent = { ...payload, id: generateId('s') };
      students.push(newStudent);
      return [201, newStudent];
    });

    mock.onPut(/\/api\/v1\/students\/\w+/).reply((config) => {
      const id = config.url?.split('/').pop();
      const payload = JSON.parse(config.data);
      const idx = students.findIndex((s) => s.id === id);
      if (idx === -1) return [404, { message: 'Student not found' }];
      students[idx] = { ...students[idx], ...payload };
      return [200, students[idx]];
    });

    mock.onDelete(/\/api\/v1\/students\/\w+/).reply((config) => {
      const id = config.url?.split('/').pop();
      students = students.filter((s) => s.id !== id);
      return [204];
    });

    // ─── LECTURERS ─────────────────────────────────────────────────────────
    mock.onGet('/api/v1/lecturers').reply(() => [200, lecturers]);

    mock.onPost('/api/v1/lecturers').reply((config) => {
      const payload = JSON.parse(config.data);
      const newLecturer = { ...payload, id: generateId('l') };
      lecturers.push(newLecturer);
      return [201, newLecturer];
    });

    mock.onPut(/\/api\/v1\/lecturers\/\w+/).reply((config) => {
      const id = config.url?.split('/').pop();
      const payload = JSON.parse(config.data);
      const idx = lecturers.findIndex((t) => t.id === id);
      if (idx === -1) return [404, { message: 'Lecturer not found' }];
      lecturers[idx] = { ...lecturers[idx], ...payload };
      return [200, lecturers[idx]];
    });

    mock.onDelete(/\/api\/v1\/lecturers\/\w+/).reply((config) => {
      const id = config.url?.split('/').pop();
      lecturers = lecturers.filter((t) => t.id !== id);
      return [204];
    });

    // ─── COURSES ──────────────────────────────────────────────────────────
    mock.onGet('/api/v1/courses').reply(() => [200, courses]);

    mock.onPost('/api/v1/courses').reply((config) => {
      const payload = JSON.parse(config.data);
      const newCourse = { ...payload, id: generateId('c'), studentIds: [] };
      courses.push(newCourse);
      return [201, newCourse];
    });

    mock.onPut(/\/api\/v1\/courses\/\w+\/enroll/).reply((config) => {
      const id = config.url?.split('/').filter(Boolean)[3];
      const { studentIds } = JSON.parse(config.data);
      const idx = courses.findIndex((c) => c.id === id);
      if (idx === -1) return [404, { message: 'Course not found' }];
      courses[idx] = { ...courses[idx], studentIds };
      return [200, courses[idx]];
    });

    mock.onPost(/\/api\/v1\/courses\/\w+\/self-enroll/).reply((config) => {
      const id = config.url?.split('/').filter(Boolean)[3];
      const { studentId } = JSON.parse(config.data);
      const idx = courses.findIndex((c) => c.id === id);
      if (idx === -1) return [404, { message: 'Course not found' }];
      const current = (courses[idx].studentIds as string[]) ?? [];
      if (current.includes(studentId)) return [400, { message: 'Already enrolled' }];
      courses[idx] = { ...courses[idx], studentIds: [...current, studentId] };
      return [200, courses[idx]];
    });

    mock.onPost(/\/api\/v1\/courses\/\w+\/self-unenroll/).reply((config) => {
      const id = config.url?.split('/').filter(Boolean)[3];
      const { studentId } = JSON.parse(config.data);
      const idx = courses.findIndex((c) => c.id === id);
      if (idx === -1) return [404, { message: 'Course not found' }];
      const current = (courses[idx].studentIds as string[]) ?? [];
      courses[idx] = { ...courses[idx], studentIds: current.filter((s) => s !== studentId) };
      return [200, courses[idx]];
    });

    mock.onPut(/\/api\/v1\/courses\/\w+/).reply((config) => {
      const id = config.url?.split('/').pop();
      const payload = JSON.parse(config.data);
      const idx = courses.findIndex((c) => c.id === id);
      if (idx === -1) return [404, { message: 'Course not found' }];
      courses[idx] = { ...courses[idx], ...payload };
      return [200, courses[idx]];
    });

    mock.onDelete(/\/api\/v1\/courses\/\w+/).reply((config) => {
      const id = config.url?.split('/').pop();
      courses = courses.filter((c) => c.id !== id);
      return [204];
    });

    // ─── ATTENDANCE ───────────────────────────────────────────────────────
    mock.onGet('/api/v1/attendance').reply((config) => {
      const { courseId, date } = config.params ?? {};
      const filtered = attendance.filter((a) => {
        if (courseId && a.courseId !== courseId) return false;
        if (date && a.date !== date) return false;
        return true;
      });
      return [200, filtered];
    });

    mock.onPost('/api/v1/attendance').reply((config) => {
      const payload = JSON.parse(config.data);
      const entries = Array.isArray(payload) ? payload : [payload];
      const created = entries.map((e: Record<string, unknown>) => ({ ...e, id: generateId('att') }));
      attendance.push(...created);
      return [201, created];
    });

    mock.onGet(/\/api\/v1\/attendance\/student\/\w+/).reply((config) => {
      const parts = config.url?.split('/') ?? [];
      const studentId = parts[parts.length - 1];
      const filtered = attendance.filter((a) => a.studentId === studentId);
      return [200, filtered];
    });

    // ─── GRADES ───────────────────────────────────────────────────────────
    mock.onGet('/api/v1/grades').reply((config) => {
      const { courseId, studentId, semester } = config.params ?? {};
      const filtered = grades.filter((g) => {
        if (courseId && g.courseId !== courseId) return false;
        if (studentId && g.studentId !== studentId) return false;
        if (semester && g.semester !== semester) return false;
        return true;
      });
      return [200, filtered];
    });

    mock.onPost('/api/v1/grades').reply((config) => {
      const payload = JSON.parse(config.data);
      const entries = Array.isArray(payload) ? payload : [payload];
      const created: Record<string, unknown>[] = [];
      entries.forEach((e: Record<string, unknown>) => {
        const existing = grades.findIndex(
          (g) => g.studentId === e.studentId && g.courseId === e.courseId && g.semester === e.semester
        );
        if (existing !== -1) {
          grades[existing] = { ...grades[existing], ...e };
          created.push(grades[existing]);
        } else {
          const newGrade = { ...e, id: generateId('g') };
          grades.push(newGrade);
          created.push(newGrade);
        }
      });
      return [201, created];
    });

    mock.onGet(/\/api\/v1\/grades\/student\/\w+\/transcript/).reply((config) => {
      const parts = config.url?.split('/') ?? [];
      const studentId = parts[parts.length - 2];
      const filtered = grades.filter((g) => g.studentId === studentId);
      return [200, filtered];
    });

    // ─── ANNOUNCEMENTS ────────────────────────────────────────────────────
    mock.onGet('/api/v1/announcements').reply((config) => {
      const role = config.params?.role;
      const filtered = role
        ? announcements.filter((a) => (a.targetRoles as string[]).includes(role))
        : announcements;
      return [200, filtered];
    });

    mock.onPost('/api/v1/announcements').reply((config) => {
      const payload = JSON.parse(config.data);
      const newAnn = { ...payload, id: generateId('an'), createdAt: new Date().toISOString() };
      announcements.push(newAnn);
      return [201, newAnn];
    });

    // ─── DEPARTMENTS ─────────────────────────────────────────────────────
    mock.onGet('/api/v1/departments').reply(() => [200, departments]);

    mock.onPost('/api/v1/departments').reply((config) => {
      const payload = JSON.parse(config.data);
      const newDept = { ...payload, id: generateId('d') };
      departments.push(newDept);
      return [201, newDept];
    });

    mock.onPut(/\/api\/v1\/departments\/\w+/).reply((config) => {
      const id = config.url?.split('/').pop();
      const payload = JSON.parse(config.data);
      const idx = departments.findIndex((d) => d.id === id);
      if (idx === -1) return [404, { message: 'Department not found' }];
      departments[idx] = { ...departments[idx], ...payload };
      return [200, departments[idx]];
    });

    mock.onDelete(/\/api\/v1\/departments\/\w+/).reply((config) => {
      const id = config.url?.split('/').pop();
      departments = departments.filter((d) => d.id !== id);
      return [204];
    });

    // ─── SEMESTERS ───────────────────────────────────────────────────────
    mock.onGet('/api/v1/semesters').reply(() => [200, semesters]);

    mock.onPost('/api/v1/semesters').reply((config) => {
      const payload = JSON.parse(config.data);
      const newSem = { ...payload, id: generateId('sem') };
      semesters.push(newSem);
      return [201, newSem];
    });

    mock.onPut(/\/api\/v1\/semesters\/\w+\/activate/).reply((config) => {
      const id = config.url?.split('/').filter(Boolean)[3];
      const idx = semesters.findIndex((s) => s.id === id);
      if (idx === -1) return [404, { message: 'Semester not found' }];
      semesters = semesters.map((s) => ({ ...s, isActive: s.id === id }));
      return [200, semesters[idx]];
    });

    mock.onPut(/\/api\/v1\/semesters\/\w+/).reply((config) => {
      const id = config.url?.split('/').pop();
      const payload = JSON.parse(config.data);
      const idx = semesters.findIndex((s) => s.id === id);
      if (idx === -1) return [404, { message: 'Semester not found' }];
      semesters[idx] = { ...semesters[idx], ...payload };
      return [200, semesters[idx]];
    });

    mock.onDelete(/\/api\/v1\/semesters\/\w+/).reply((config) => {
      const id = config.url?.split('/').pop();
      semesters = semesters.filter((s) => s.id !== id);
      return [204];
    });

    // ─── ACCOUNT REQUESTS ────────────────────────────────────────────────
    const accountRequests: Record<string, unknown>[] = [...accountRequestsData];

    mock.onGet('/api/v1/account-requests').reply(() => [200, accountRequests]);

    mock.onPost('/api/v1/account-requests').reply((config) => {
      const payload = JSON.parse(config.data);
      const newRequest = {
        ...payload,
        id: generateId('req'),
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
      accountRequests.push(newRequest);
      return [201, newRequest];
    });

    mock.onPut(/\/api\/v1\/account-requests\/\w+\/approve/).reply((config) => {
      const id = config.url?.split('/').filter(Boolean)[3];
      const { schoolEmail, password } = JSON.parse(config.data);
      const idx = accountRequests.findIndex((r) => r.id === id);
      if (idx === -1) return [404, { message: 'Request not found' }];
      accountRequests[idx] = {
        ...accountRequests[idx],
        status: 'approved',
        schoolEmail,
        password,
        approvedAt: new Date().toISOString(),
      };
      return [200, accountRequests[idx]];
    });

    mock.onPut(/\/api\/v1\/account-requests\/\w+\/reject/).reply((config) => {
      const id = config.url?.split('/').filter(Boolean)[3];
      const idx = accountRequests.findIndex((r) => r.id === id);
      if (idx === -1) return [404, { message: 'Request not found' }];
      accountRequests[idx] = { ...accountRequests[idx], status: 'rejected' };
      return [200, accountRequests[idx]];
    });
  });
}
