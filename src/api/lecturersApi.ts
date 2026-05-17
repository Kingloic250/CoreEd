import axiosInstance from './axiosInstance';

const BASE = '/api/v1/lecturers';

export const getAllLecturers = (params?: Record<string, unknown>) =>
  axiosInstance.get(BASE, { params }) as unknown as Promise<unknown[]>;

export const getCurrentLecturer = () =>
  axiosInstance.get(`${BASE}/profile`) as unknown as Promise<unknown>;

export const createLecturer = (payload: unknown) =>
  axiosInstance.post(BASE, payload) as unknown as Promise<unknown>;

export const updateLecturer = (id: string, payload: unknown) =>
  axiosInstance.put(`${BASE}/${id}`, payload) as unknown as Promise<unknown>;

export const deleteLecturer = (id: string) =>
  axiosInstance.delete(`${BASE}/${id}`) as unknown as Promise<void>;
