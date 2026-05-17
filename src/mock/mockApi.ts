// Central mock API handler using axios-mock-adapter. Activated when VITE_MOCK_API=true.
import axiosInstance from '@/api/axiosInstance';
import users from './data/users.json';
import studentsData from './data/students.json';
import teachersData from './data/teachers.json';
import classesData from './data/classes.json';
import attendanceData from './data/attendance.json';
import gradesData from './data/grades.json';
import announcementsData from './data/announcements.json';

// In-memory mutable stores for CRUD operations
let students = [...studentsData] as Record<string, unknown>[];
let teachers = [...teachersData] as Record<string, unknown>[];
let classes = [...classesData] as Record<string, unknown>[];
let attendance = [...attendanceData] as Record<string, unknown>[];
let grades = [...gradesData] as Record<string, unknown>[];
let announcements = [...announcementsData] as Record<string, unknown>[];

const generateId = (prefix: string) => `${prefix}${Date.now()}`;

export function setupMockApi() {
  if (import.meta.env.VITE_MOCK_API !== 'true') return;

  // Dynamic import to keep mock adapter out of production bundle
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

    // ─── STUDENTS ─────────────────────────────────────────────────────────
    mock.onGet('/api/v1/students').reply((config) => {
      const search = (config.params?.search ?? '').toLowerCase();
      const filtered = search
        ? students.filter((s) =>
            `${s.firstName} ${s.lastName}`.toLowerCase().includes(search) ||
            (s.class as string).toLowerCase().includes(search)
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

    // ─── TEACHERS ─────────────────────────────────────────────────────────
    mock.onGet('/api/v1/teachers').reply(() => [200, teachers]);

    mock.onPost('/api/v1/teachers').reply((config) => {
      const payload = JSON.parse(config.data);
      const newTeacher = { ...payload, id: generateId('t') };
      teachers.push(newTeacher);
      return [201, newTeacher];
    });

    mock.onPut(/\/api\/v1\/teachers\/\w+/).reply((config) => {
      const id = config.url?.split('/').pop();
      const payload = JSON.parse(config.data);
      const idx = teachers.findIndex((t) => t.id === id);
      if (idx === -1) return [404, { message: 'Teacher not found' }];
      teachers[idx] = { ...teachers[idx], ...payload };
      return [200, teachers[idx]];
    });

    mock.onDelete(/\/api\/v1\/teachers\/\w+/).reply((config) => {
      const id = config.url?.split('/').pop();
      teachers = teachers.filter((t) => t.id !== id);
      return [204];
    });

    // ─── CLASSES ──────────────────────────────────────────────────────────
    mock.onGet('/api/v1/classes').reply(() => [200, classes]);

    mock.onPost('/api/v1/classes').reply((config) => {
      const payload = JSON.parse(config.data);
      const newClass = { ...payload, id: generateId('c'), studentIds: [] };
      classes.push(newClass);
      return [201, newClass];
    });

    mock.onPut(/\/api\/v1\/classes\/\w+/).reply((config) => {
      const id = config.url?.split('/').pop();
      const payload = JSON.parse(config.data);
      const idx = classes.findIndex((c) => c.id === id);
      if (idx === -1) return [404, { message: 'Class not found' }];
      classes[idx] = { ...classes[idx], ...payload };
      return [200, classes[idx]];
    });

    mock.onDelete(/\/api\/v1\/classes\/\w+/).reply((config) => {
      const id = config.url?.split('/').pop();
      classes = classes.filter((c) => c.id !== id);
      return [204];
    });

    // ─── ATTENDANCE ───────────────────────────────────────────────────────
    mock.onGet('/api/v1/attendance').reply((config) => {
      const { classId, date } = config.params ?? {};
      const filtered = attendance.filter((a) => {
        if (classId && a.classId !== classId) return false;
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
      const { classId, studentId, term } = config.params ?? {};
      const filtered = grades.filter((g) => {
        if (classId && g.classId !== classId) return false;
        if (studentId && g.studentId !== studentId) return false;
        if (term && g.term !== term) return false;
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
          (g) => g.studentId === e.studentId && g.classId === e.classId && g.term === e.term
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

    // ─── ACCOUNT REQUESTS ────────────────────────────────────────────────
    const accountRequests: Record<string, unknown>[] = [];

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
