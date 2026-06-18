import axiosInstance from './axiosInstance';

const BASE = '/api/v1/enroll';

export const enrollStudent = (payload: { courseId: string; groupId: string; studentId: string }) =>
  axiosInstance.post(BASE, payload) as unknown as Promise<{ message: string; enrolledCount: number }>;

export const unenrollStudent = (courseId: string, studentId: string) =>
  axiosInstance.delete(`${BASE}/${courseId}`, { data: { studentId } }) as unknown as Promise<{ message: string }>;

export const getMyEnrollments = (studentId?: string) =>
  axiosInstance.get(`${BASE}/mine`, { params: { studentId } }) as unknown as Promise<{
    groups: Record<string, unknown>[];
    courses: Record<string, unknown>[];
  }>;

export const getCourseEnrollments = (courseId: string) =>
  axiosInstance.get(`${BASE}/course/${courseId}`) as unknown as Promise<Record<string, unknown>[]>;
