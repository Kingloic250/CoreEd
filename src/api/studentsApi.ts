// Student CRUD endpoints
import axiosInstance from './axiosInstance';

const BASE = '/api/v1/students';

export const getAllStudents = (params?: { page?: number; limit?: number; search?: string }) =>
  axiosInstance.get(BASE, { params }) as unknown as Promise<unknown[]>;

export const getStudentById = (id: string) =>
  axiosInstance.get(`${BASE}/${id}`) as unknown as Promise<unknown>;

export const createStudent = (payload: unknown) =>
  axiosInstance.post(BASE, payload) as unknown as Promise<unknown>;

export const updateStudent = (id: string, payload: unknown) =>
  axiosInstance.put(`${BASE}/${id}`, payload) as unknown as Promise<unknown>;

export const deleteStudent = (id: string) =>
  axiosInstance.delete(`${BASE}/${id}`) as unknown as Promise<void>;
