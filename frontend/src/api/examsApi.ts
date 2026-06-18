import axiosInstance from './axiosInstance';

const BASE = '/api/v1/exams';

export const getExams = (params?: { courseId?: string; groupId?: string; lecturerId?: string; status?: string; type?: string }) =>
  axiosInstance.get(BASE, { params }) as unknown as Promise<unknown[]>;

export const getExam = (id: string) =>
  axiosInstance.get(`${BASE}/${id}`) as unknown as Promise<unknown>;

export const createExam = (payload: Record<string, unknown>) =>
  axiosInstance.post(BASE, payload) as unknown as Promise<unknown>;

export const updateExam = (id: string, payload: Record<string, unknown>) =>
  axiosInstance.put(`${BASE}/${id}`, payload) as unknown as Promise<unknown>;

export const deleteExam = (id: string) =>
  axiosInstance.delete(`${BASE}/${id}`) as unknown as Promise<void>;

export const updateExamStatus = (id: string, status: string) =>
  axiosInstance.put(`${BASE}/${id}/status`, { status }) as unknown as Promise<unknown>;

export const createExamResult = (examId: string, payload: { studentId: string; score: number; comments?: string }) =>
  axiosInstance.post(`${BASE}/${examId}/results`, payload) as unknown as Promise<unknown>;

export const submitExamResults = (examId: string) =>
  axiosInstance.post(`${BASE}/${examId}/submit`) as unknown as Promise<{ message: string; count: number }>;

export const approveExamResult = (resultId: string) =>
  axiosInstance.put(`${BASE}/results/${resultId}/approve`) as unknown as Promise<unknown>;

export const rejectExamResult = (resultId: string, payload?: { rejectionNote?: string }) =>
  axiosInstance.put(`${BASE}/results/${resultId}/reject`, payload) as unknown as Promise<unknown>;
