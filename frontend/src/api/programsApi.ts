import axiosInstance from './axiosInstance';

const BASE = '/api/v1/programs';

export const getPrograms = (params?: { facultyId?: string }) =>
  axiosInstance.get(BASE, { params }) as unknown as Promise<unknown[]>;

export const getProgram = (id: string) =>
  axiosInstance.get(`${BASE}/${id}`) as unknown as Promise<unknown>;

export const createProgram = (payload: Record<string, unknown>) =>
  axiosInstance.post(BASE, payload) as unknown as Promise<unknown>;

export const updateProgram = (id: string, payload: Record<string, unknown>) =>
  axiosInstance.put(`${BASE}/${id}`, payload) as unknown as Promise<unknown>;

export const deleteProgram = (id: string) =>
  axiosInstance.delete(`${BASE}/${id}`) as unknown as Promise<void>;

export const getCurricula = (programId: string) =>
  axiosInstance.get(`${BASE}/${programId}/curricula`) as unknown as Promise<unknown[]>;

export const createCurriculum = (programId: string, payload: Record<string, unknown>) =>
  axiosInstance.post(`${BASE}/${programId}/curricula`, payload) as unknown as Promise<unknown>;

export const updateCurriculum = (id: string, payload: Record<string, unknown>) =>
  axiosInstance.put(`${BASE}/curricula/${id}`, payload) as unknown as Promise<unknown>;

export const deleteCurriculum = (id: string) =>
  axiosInstance.delete(`${BASE}/curricula/${id}`) as unknown as Promise<void>;

export const getCurriculumCourses = (curriculumId: string) =>
  axiosInstance.get(`${BASE}/curricula/${curriculumId}/courses`) as unknown as Promise<unknown[]>;

export const addProgramCourse = (payload: Record<string, unknown>) =>
  axiosInstance.post(`${BASE}/courses`, payload) as unknown as Promise<unknown>;

export const updateProgramCourse = (id: string, payload: Record<string, unknown>) =>
  axiosInstance.put(`${BASE}/courses/${id}`, payload) as unknown as Promise<unknown>;

export const deleteProgramCourse = (id: string) =>
  axiosInstance.delete(`${BASE}/courses/${id}`) as unknown as Promise<void>;

export const getProgramEnrollments = (programId: string) =>
  axiosInstance.get(`${BASE}/${programId}/enrollments`) as unknown as Promise<unknown[]>;

export const createProgramEnrollment = (payload: Record<string, unknown>) =>
  axiosInstance.post(`${BASE}/enrollments`, payload) as unknown as Promise<unknown>;

export const updateProgramEnrollment = (id: string, payload: Record<string, unknown>) =>
  axiosInstance.put(`${BASE}/enrollments/${id}`, payload) as unknown as Promise<unknown>;

export const getStudentProgram = (studentId: string) =>
  axiosInstance.get(`${BASE}/student/${studentId}/program`) as unknown as Promise<unknown>;
