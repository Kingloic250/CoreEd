import axiosInstance from './axiosInstance';

const BASE = '/api/v1/courses';

export const getAllCourses = (params?: Record<string, unknown>) =>
  axiosInstance.get(BASE, { params }) as unknown as Promise<unknown[]>;

export const getCourseById = (id: string) =>
  axiosInstance.get(`${BASE}/${id}`) as unknown as Promise<unknown>;

export const createCourse = (payload: unknown) =>
  axiosInstance.post(BASE, payload) as unknown as Promise<unknown>;

export const updateCourse = (id: string, payload: unknown) =>
  axiosInstance.put(`${BASE}/${id}`, payload) as unknown as Promise<unknown>;

export const deleteCourse = (id: string) =>
  axiosInstance.delete(`${BASE}/${id}`) as unknown as Promise<void>;

export const enrollStudents = (id: string, studentIds: string[]) =>
  axiosInstance.put(`${BASE}/${id}/enroll`, { studentIds }) as unknown as Promise<unknown>;

export const selfEnroll = (id: string, studentId: string) =>
  axiosInstance.post(`${BASE}/${id}/self-enroll`, { studentId }) as unknown as Promise<unknown>;

export const selfUnenroll = (id: string, studentId: string) =>
  axiosInstance.post(`${BASE}/${id}/self-unenroll`, { studentId }) as unknown as Promise<unknown>;
