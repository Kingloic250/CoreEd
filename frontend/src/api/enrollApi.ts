import axiosInstance from './axiosInstance';

const BASE = '/api/v1/enroll';

export const enrollStudent = (payload: { courseId: string; groupId: string; studentId: string }) =>
  axiosInstance.post(BASE, payload) as unknown as Promise<{ message: string; enrolledCount: number }>;

export const dropCourse = (courseId: string, studentId: string) =>
  axiosInstance.post(`${BASE}/drop`, { courseId, studentId }) as unknown as Promise<{ message: string; status: string }>;

export const joinWaitlist = (payload: { courseId: string; groupId: string; studentId: string }) =>
  axiosInstance.post(`${BASE}/waitlist`, payload) as unknown as Promise<{ message: string; position: number }>;

export const getMyEnrollments = (studentId?: string) =>
  axiosInstance.get(`${BASE}/mine`, { params: { studentId } }) as unknown as Promise<{
    enrollments: Record<string, unknown>[];
    courses: Record<string, unknown>[];
  }>;

export const getCourseEnrollments = (courseId: string) =>
  axiosInstance.get(`${BASE}/course/${courseId}`) as unknown as Promise<Record<string, unknown>[]>;

export const getCreditUsage = (studentId?: string) =>
  axiosInstance.get(`${BASE}/credits`, { params: { studentId } }) as unknown as Promise<{
    currentCredits: number;
    maxCredits: number;
    remainingCredits: number;
    activeSemester: Record<string, unknown> | null;
  }>;

export const getMyWaitlist = (studentId: string) =>
  axiosInstance.get(`${BASE}/waitlist/${studentId}`) as unknown as Promise<Record<string, unknown>[]>;
