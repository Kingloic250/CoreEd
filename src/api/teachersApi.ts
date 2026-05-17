// Teacher CRUD endpoints
import axiosInstance from './axiosInstance';

const BASE = '/api/v1/teachers';

export const getAllTeachers = (params?: Record<string, unknown>) =>
  axiosInstance.get(BASE, { params }) as unknown as Promise<unknown[]>;

export const createTeacher = (payload: unknown) =>
  axiosInstance.post(BASE, payload) as unknown as Promise<unknown>;

export const updateTeacher = (id: string, payload: unknown) =>
  axiosInstance.put(`${BASE}/${id}`, payload) as unknown as Promise<unknown>;

export const deleteTeacher = (id: string) =>
  axiosInstance.delete(`${BASE}/${id}`) as unknown as Promise<void>;
