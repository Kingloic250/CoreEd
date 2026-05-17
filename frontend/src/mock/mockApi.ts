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
let userAccounts = [...users] as Record<string, unknown>[];

const generateId = (prefix: string) => `${prefix}${Date.now()}`;

export function setupMockApi() {
  if (import.meta.env.VITE_MOCK_API !== 'true') return;

  import('axios-mock-adapter').then(({ default: MockAdapter }) => {
    const mock = new MockAdapter(axiosInstance, { delayResponse: 400, onNoMatch: 'passthrough' });

    // ─── AUTH ─────────────────────────────────────────────────────────────
    mock.onPost('/api/v1/auth/login').reply((config) => {
      const { email, password } = JSON.parse(config.data);
      const user = (userAccounts as unknown as Record<string, string>[]).find(
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
      const user = (userAccounts as unknown as Record<string, string>[]).find(
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
      const user = (userAccounts as unknown as Record<string, string>[]).find(
        (u) => `mock.jwt.token_${u.role}` === token
      );
      if (!user) return [401, { message: 'Unauthorized' }];
      return [200, { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar }];
    });

    mock.onPut('/api/v1/profile').reply((config) => {
      const { name, email } = JSON.parse(config.data);
      const token = getToken();
      const user = (userAccounts as unknown as Record<string, string>[]).find(
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

    mock.onGet('/api/v1/students/profile').reply(() => {
      const token = getToken();
      const user = (userAccounts as unknown as Record<string, string>[]).find(
        (u) => `mock.jwt.token_${u.role}` === token
      );
      if (!user) return [401, { message: 'Unauthorized' }];
      const studentProfile = (students as Record<string, string>[]).find(
        (s) => s.email === user.email
      );
      if (!studentProfile) return [404, { message: 'Student profile not found' }];
      return [200, studentProfile];
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
      logAudit('create_student', 'student', newStudent.id, `Created student ${payload.firstName} ${payload.lastName} (${payload.year})`);
      return [201, newStudent];
    });

    mock.onPut(/\/api\/v1\/students\/\w+/).reply((config) => {
      const id = config.url?.split('/').pop();
      const payload = JSON.parse(config.data);
      const idx = students.findIndex((s) => s.id === id);
      if (idx === -1) return [404, { message: 'Student not found' }];
      students[idx] = { ...students[idx], ...payload };
      logAudit('update_student', 'student', id, `Updated student ${payload.firstName ?? students[idx].firstName} ${payload.lastName ?? students[idx].lastName}`);
      return [200, students[idx]];
    });

    mock.onDelete(/\/api\/v1\/students\/\w+/).reply((config) => {
      const id = config.url?.split('/').pop();
      const student = students.find((s) => s.id === id);
      students = students.filter((s) => s.id !== id);
      if (student) logAudit('delete_student', 'student', id, `Deleted student ${student.firstName} ${student.lastName}`);
      return [204];
    });

    // ─── LECTURERS ─────────────────────────────────────────────────────────
    mock.onGet('/api/v1/lecturers').reply(() => [200, lecturers]);

    mock.onGet(/\/api\/v1\/lecturers\/profile/).reply(() => {
      const token = getToken();
      const user = (userAccounts as unknown as Record<string, string>[]).find(
        (u) => `mock.jwt.token_${u.role}` === token
      );
      if (!user) return [401, { message: 'Unauthorized' }];
      const lecturerProfile = (lecturers as Record<string, string>[]).find(
        (l) => l.email === user.email
      );
      if (!lecturerProfile) return [404, { message: 'Lecturer profile not found' }];
      return [200, lecturerProfile];
    });

    mock.onPost('/api/v1/lecturers').reply((config) => {
      const payload = JSON.parse(config.data);
      const { password, ...lecturerData } = payload;
      const newLecturer = { ...lecturerData, id: generateId('l') };
      lecturers.push(newLecturer);

      const newUser = {
        id: generateId('u'),
        name: `${payload.firstName} ${payload.lastName}`,
        email: payload.email,
        password: password ?? 'Lecturer@1234',
        role: 'lecturer',
        avatar: null,
      };
      (userAccounts as Record<string, unknown>[]).push(newUser);

      logAudit('create_lecturer', 'lecturer', newLecturer.id, `Created lecturer ${payload.firstName} ${payload.lastName} (${payload.department})`);
      return [201, newLecturer];
    });

    mock.onPut(/\/api\/v1\/lecturers\/\w+/).reply((config) => {
      const id = config.url?.split('/').pop();
      const payload = JSON.parse(config.data);
      const idx = lecturers.findIndex((t) => t.id === id);
      if (idx === -1) return [404, { message: 'Lecturer not found' }];
      lecturers[idx] = { ...lecturers[idx], ...payload };
      logAudit('update_lecturer', 'lecturer', id, `Updated lecturer ${payload.firstName ?? lecturers[idx].firstName} ${payload.lastName ?? lecturers[idx].lastName}`);
      return [200, lecturers[idx]];
    });

    mock.onDelete(/\/api\/v1\/lecturers\/\w+/).reply((config) => {
      const id = config.url?.split('/').pop();
      const lecturer = lecturers.find((t) => t.id === id);
      lecturers = lecturers.filter((t) => t.id !== id);
      if (lecturer) logAudit('delete_lecturer', 'lecturer', id, `Deleted lecturer ${lecturer.firstName} ${lecturer.lastName}`);
      return [204];
    });

    // ─── COURSES ──────────────────────────────────────────────────────────
    mock.onGet(/\/api\/v1\/courses\/[^/]+$/).reply((config) => {
      const id = config.url?.split('/').pop();
      const course = (courses as Record<string, string>[]).find((c) => c.id === id);
      if (!course) return [404, { message: 'Course not found' }];
      return [200, course];
    });

    mock.onGet('/api/v1/courses').reply((config) => {
      const semesterId = config.params?.semesterId;
      const lecturerId = config.params?.lecturerId;
      const studentId = config.params?.studentId;
      let result = [...(courses as Record<string, string>[])];
      if (semesterId) {
        result = result.filter((c) => c.semesterId === String(semesterId));
      }
      if (lecturerId) {
        result = result.filter((c) => c.lecturerId === String(lecturerId));
      }
      if (studentId) {
        result = result.filter(
          (c) => (c.studentIds as string[])?.includes(String(studentId))
        );
      }
      return [200, result];
    });

    mock.onPut(/\/api\/v1\/courses\/\w+\/enroll/).reply((config) => {
      const id = config.url?.split('/').filter(Boolean)[3];
      const { studentIds } = JSON.parse(config.data);
      const idx = courses.findIndex((c) => c.id === id);
      if (idx === -1) return [404, { message: 'Course not found' }];
      const prevCount = (courses[idx].studentIds as string[])?.length ?? 0;
      courses[idx] = { ...courses[idx], studentIds };
      logAudit('bulk_enroll', 'course', id, `Bulk enrolled ${studentIds.length} students in ${courses[idx].name} (was ${prevCount})`);
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
      logAudit('update_course', 'course', id, `Updated course ${payload.name ?? courses[idx].name}`);
      return [200, courses[idx]];
    });

    mock.onDelete(/\/api\/v1\/courses\/\w+/).reply((config) => {
      const id = config.url?.split('/').pop();
      const course = courses.find((c) => c.id === id);
      courses = courses.filter((c) => c.id !== id);
      if (course) logAudit('delete_course', 'course', id, `Deleted course ${course.name}`);
      return [204];
    });

    // ─── ATTENDANCE ───────────────────────────────────────────────────────
    mock.onGet('/api/v1/attendance').reply((config) => {
      const { courseId, date, markedBy } = config.params ?? {};
      const filtered = attendance.filter((a) => {
        if (courseId && a.courseId !== courseId) return false;
        if (date && a.date !== date) return false;
        if (markedBy && a.markedBy !== markedBy) return false;
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
      logAudit('create_department', 'department', newDept.id, `Created department ${payload.name} (${payload.code})`);
      return [201, newDept];
    });

    mock.onPut(/\/api\/v1\/departments\/\w+/).reply((config) => {
      const id = config.url?.split('/').pop();
      const payload = JSON.parse(config.data);
      const idx = departments.findIndex((d) => d.id === id);
      if (idx === -1) return [404, { message: 'Department not found' }];
      departments[idx] = { ...departments[idx], ...payload };
      logAudit('update_department', 'department', id, `Updated department ${payload.name ?? departments[idx].name}`);
      return [200, departments[idx]];
    });

    mock.onDelete(/\/api\/v1\/departments\/\w+/).reply((config) => {
      const id = config.url?.split('/').pop();
      const dept = departments.find((d) => d.id === id);
      departments = departments.filter((d) => d.id !== id);
      if (dept) logAudit('delete_department', 'department', id, `Deleted department ${dept.name}`);
      return [204];
    });

    // ─── SEMESTERS ───────────────────────────────────────────────────────
    mock.onGet('/api/v1/semesters').reply(() => [200, semesters]);

    mock.onPost('/api/v1/semesters').reply((config) => {
      const payload = JSON.parse(config.data);
      const newSem = { ...payload, id: generateId('sem') };
      semesters.push(newSem);
      logAudit('create_semester', 'semester', newSem.id, `Created semester ${payload.name} (${payload.year})`);
      return [201, newSem];
    });

    mock.onPut(/\/api\/v1\/semesters\/\w+\/activate/).reply((config) => {
      const id = config.url?.split('/').filter(Boolean)[3];
      const idx = semesters.findIndex((s) => s.id === id);
      if (idx === -1) return [404, { message: 'Semester not found' }];
      semesters = semesters.map((s) => ({ ...s, isActive: s.id === id }));
      logAudit('set_active_semester', 'semester', id, `Set ${semesters[idx].name} (${semesters[idx].year}) as active semester`);
      return [200, semesters[idx]];
    });

    mock.onPut(/\/api\/v1\/semesters\/\w+/).reply((config) => {
      const id = config.url?.split('/').pop();
      const payload = JSON.parse(config.data);
      const idx = semesters.findIndex((s) => s.id === id);
      if (idx === -1) return [404, { message: 'Semester not found' }];
      semesters[idx] = { ...semesters[idx], ...payload };
      logAudit('update_semester', 'semester', id, `Updated semester ${payload.name ?? semesters[idx].name}`);
      return [200, semesters[idx]];
    });

    mock.onDelete(/\/api\/v1\/semesters\/\w+/).reply((config) => {
      const id = config.url?.split('/').pop();
      const sem = semesters.find((s) => s.id === id);
      semesters = semesters.filter((s) => s.id !== id);
      if (sem) logAudit('delete_semester', 'semester', id, `Deleted semester ${sem.name} (${sem.year})`);
      return [204];
    });

    // ─── AUDIT LOGS ─────────────────────────────────────────────────────
    function logAudit(action: string, targetType: string, targetId: string, details: string) {
      const token = getToken();
      const user = (userAccounts as unknown as Record<string, string>[]).find(
        (u) => `mock.jwt.token_${u.role}` === token
      );
      auditLogs.push({
        id: generateId('al'),
        action,
        performedBy: user?.name ?? 'Unknown',
        performedById: user?.id ?? '',
        targetType,
        targetId,
        details,
        timestamp: new Date().toISOString(),
      });
    }

    mock.onGet('/api/v1/audit-logs').reply(() => [200, auditLogs]);

    // ─── USERS (Admin Management) ──────────────────────────────────────
    mock.onGet('/api/v1/users').reply(() => {
      const safe = userAccounts.map((u) => {
        const { password, ...rest } = u;
        return rest;
      });
      return [200, safe];
    });

    mock.onPut(/\/api\/v1\/users\/\w+\/reset-password/).reply((config) => {
      const id = config.url?.split('/').filter(Boolean)[3];
      const { newPassword } = JSON.parse(config.data);
      const idx = userAccounts.findIndex((u) => u.id === id);
      if (idx === -1) return [404, { message: 'User not found' }];
      userAccounts[idx] = { ...userAccounts[idx], password: newPassword };
      logAudit('reset_password', 'user', id, `Reset password for ${userAccounts[idx].name}`);
      return [200, { message: 'Password reset successfully' }];
    });

    mock.onPut(/\/api\/v1\/users\/\w+/).reply((config) => {
      const id = config.url?.split('/').pop();
      const payload = JSON.parse(config.data);
      const idx = userAccounts.findIndex((u) => u.id === id);
      if (idx === -1) return [404, { message: 'User not found' }];
      userAccounts[idx] = { ...userAccounts[idx], ...payload };
      logAudit('update_user', 'user', id, `Updated user ${payload.name ?? userAccounts[idx].name}`);
      return [200, { ...userAccounts[idx], password: undefined }];
    });

    mock.onDelete(/\/api\/v1\/users\/\w+/).reply((config) => {
      const id = config.url?.split('/').pop();
      const u = userAccounts.find((u) => u.id === id);
      userAccounts = userAccounts.filter((u) => u.id !== id);
      if (u) logAudit('delete_user', 'user', id, `Deleted user ${u.name} (${u.role})`);
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

      const requestName = String(accountRequests[idx].name ?? '');
      const nameParts = requestName.split(' ');
      const firstName = nameParts[0] || requestName;
      const lastName = nameParts.slice(1).join(' ') || 'Student';

      const newUser = {
        id: generateId('u'),
        name: requestName,
        email: schoolEmail,
        password,
        role: 'student',
        avatar: null,
      };
      (userAccounts as Record<string, unknown>[]).push(newUser);

      const newStudent = {
        id: generateId('s'),
        firstName,
        lastName,
        email: schoolEmail,
        dateOfBirth: '',
        gender: 'male',
        year: 'Year 1',
        enrollmentDate: new Date().toISOString().split('T')[0],
        status: 'active',
      };
      (students as Record<string, unknown>[]).push(newStudent);

      logAudit('approve_request', 'account_request', id, `Approved account request for ${accountRequests[idx].name} (${schoolEmail})`);
      return [200, accountRequests[idx]];
    });

    mock.onPut(/\/api\/v1\/account-requests\/\w+\/reject/).reply((config) => {
      const id = config.url?.split('/').filter(Boolean)[3];
      const idx = accountRequests.findIndex((r) => r.id === id);
      if (idx === -1) return [404, { message: 'Request not found' }];
      accountRequests[idx] = { ...accountRequests[idx], status: 'rejected' };
      logAudit('reject_request', 'account_request', id, `Rejected account request from ${accountRequests[idx].name}`);
      return [200, accountRequests[idx]];
    });
  });
}
