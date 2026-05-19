import axiosInstance from './axiosInstance';

const BASE = '/api/v1/assignments';

export const getAssignments = (params?: {
  courseId?: string;
  studentId?: string;
}) => axiosInstance.get(BASE, { params }) as unknown as Promise<unknown[]>;

export const getAssignmentById = (id: string) =>
  axiosInstance.get(`${BASE}/${id}`) as unknown as Promise<unknown>;

export const createAssignment = (data: Record<string, unknown>) =>
  axiosInstance.post(BASE, data) as unknown as Promise<unknown>;

export const updateAssignment = (id: string, data: Record<string, unknown>) =>
  axiosInstance.put(`${BASE}/${id}`, data) as unknown as Promise<unknown>;

export const deleteAssignment = (id: string) =>
  axiosInstance.delete(`${BASE}/${id}`) as unknown as Promise<void>;

export const submitAssignment = (id: string, data: {
  studentId: string;
  fileUrl?: string;
  content?: string;
}) => axiosInstance.post(`${BASE}/${id}/submit`, data) as unknown as Promise<unknown>;

export const gradeSubmission = (assignmentId: string, studentId: string, data: {
  score: number;
  feedback: string;
}) => axiosInstance.put(`${BASE}/${assignmentId}/grade/${studentId}`, data) as unknown as Promise<unknown>;
