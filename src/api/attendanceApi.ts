import axiosInstance from './axiosInstance';

const BASE = '/api/v1/attendance';

export const getAttendance = (params: { courseId?: string; date?: string; studentId?: string; markedBy?: string }) =>
  axiosInstance.get(BASE, { params }) as unknown as Promise<unknown[]>;

export const logAttendance = (payload: unknown) =>
  axiosInstance.post(BASE, payload) as unknown as Promise<unknown>;

export const markAttendance = (payload: {
  courseId: string;
  date: string;
  entries: { studentId: string; status: string }[];
  markedBy: string;
}) => axiosInstance.post(`${BASE}/mark`, payload) as unknown as Promise<unknown>;

export const getStudentAttendance = (studentId: string) =>
  axiosInstance.get(`${BASE}/student/${studentId}`) as unknown as Promise<unknown[]>;
