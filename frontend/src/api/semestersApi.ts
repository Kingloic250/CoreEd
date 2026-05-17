import axiosInstance from './axiosInstance';
import { API_PATHS } from '@/utils/constants';

const BASE = API_PATHS.SEMESTERS;

export const getAllSemesters = () =>
  axiosInstance.get(BASE) as unknown as Promise<unknown[]>;

export const createSemester = (payload: unknown) =>
  axiosInstance.post(BASE, payload) as unknown as Promise<unknown>;

export const updateSemester = (id: string, payload: unknown) =>
  axiosInstance.put(`${BASE}/${id}`, payload) as unknown as Promise<unknown>;

export const deleteSemester = (id: string) =>
  axiosInstance.delete(`${BASE}/${id}`) as unknown as Promise<void>;

export const setActiveSemester = (id: string) =>
  axiosInstance.put(`${BASE}/${id}/activate`) as unknown as Promise<unknown>;
