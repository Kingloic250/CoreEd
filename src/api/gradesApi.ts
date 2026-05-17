import axiosInstance from './axiosInstance';

const BASE = '/api/v1/grades';

export const getGrades = (params: { courseId?: string; studentId?: string; semester?: string }) =>
  axiosInstance.get(BASE, { params }) as unknown as Promise<unknown[]>;

export const submitGrades = (payload: unknown) =>
  axiosInstance.post(BASE, payload) as unknown as Promise<unknown>;

export const createGrade = (payload: unknown) =>
  axiosInstance.post(BASE, payload) as unknown as Promise<unknown>;

export const getTranscript = (studentId: string) =>
  axiosInstance.get(`${BASE}/student/${studentId}/transcript`) as unknown as Promise<unknown[]>;
