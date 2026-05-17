import axiosInstance from './axiosInstance';
import { API_PATHS } from '@/utils/constants';

const BASE = API_PATHS.DEPARTMENTS;

export const getAllDepartments = () =>
  axiosInstance.get(BASE) as unknown as Promise<unknown[]>;

export const getDepartmentById = (id: string) =>
  axiosInstance.get(`${BASE}/${id}`) as unknown as Promise<unknown>;

export const createDepartment = (payload: unknown) =>
  axiosInstance.post(BASE, payload) as unknown as Promise<unknown>;

export const updateDepartment = (id: string, payload: unknown) =>
  axiosInstance.put(`${BASE}/${id}`, payload) as unknown as Promise<unknown>;

export const deleteDepartment = (id: string) =>
  axiosInstance.delete(`${BASE}/${id}`) as unknown as Promise<void>;
