import axiosInstance from './axiosInstance';

const BASE = '/api/v1/grades';

export const getGrades = (params?: { courseId?: string; groupId?: string; semester?: string; status?: string; studentId?: string }) =>
  axiosInstance.get(BASE, { params }) as unknown as Promise<unknown[]>;

export const getAdminGrades = (params?: { courseId?: string; lecturerId?: string; groupId?: string; status?: string; semester?: string }) =>
  axiosInstance.get(`${BASE}/admin`, { params }) as unknown as Promise<unknown[]>;

export const createGrade = (payload: Record<string, unknown>) =>
  axiosInstance.post(BASE, payload) as unknown as Promise<unknown>;

export const submitGrades = (payload: { courseId: string; groupId?: string; semester?: string }) =>
  axiosInstance.post(`${BASE}/submit`, payload) as unknown as Promise<{ message: string; count: number }>;

export const approveGrade = (id: string) =>
  axiosInstance.put(`${BASE}/${id}/approve`) as unknown as Promise<unknown>;

export const rejectGrade = (id: string, payload?: { rejectionNote?: string }) =>
  axiosInstance.put(`${BASE}/${id}/reject`, payload) as unknown as Promise<unknown>;

export const approveAllGrades = (payload: { courseId: string; groupId?: string }) =>
  axiosInstance.post(`${BASE}/approve-all`, payload) as unknown as Promise<{ message: string; count: number }>;

export const getTranscript = (studentId: string) =>
  axiosInstance.get(`${BASE}/student/${studentId}/transcript`) as unknown as Promise<{
    grades: unknown[]; semesterGpas: Record<string, number>; cumulativeGpa: number;
    totalCredits: number; totalGradePoints: number; academicStanding: string;
  }>;

export const getStudentStanding = (studentId: string) =>
  axiosInstance.get(`${BASE}/student/${studentId}/standing`) as unknown as Promise<{
    cumulativeGpa: number; semesterGpas: Record<string, number>;
    totalCredits: number; totalGradePoints: number; academicStanding: string;
  }>;

export const downloadTranscriptPdf = (studentId: string) =>
  axiosInstance.get(`${BASE}/student/${studentId}/transcript/pdf`, {
    responseType: 'blob',
  }) as unknown as Promise<Blob>;
