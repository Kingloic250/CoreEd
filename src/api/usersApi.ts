import axiosInstance from './axiosInstance';
import { API_PATHS } from '@/utils/constants';

const BASE = API_PATHS.USERS;

export const getAllUsers = () =>
  axiosInstance.get(BASE) as unknown as Promise<unknown[]>;

export const updateUser = (id: string, payload: { name?: string; email?: string; role?: string }) =>
  axiosInstance.put(`${BASE}/${id}`, payload) as unknown as Promise<unknown>;

export const resetPassword = (id: string, newPassword: string) =>
  axiosInstance.put(`${BASE}/${id}/reset-password`, { newPassword }) as unknown as Promise<unknown>;

export const deleteUser = (id: string) =>
  axiosInstance.delete(`${BASE}/${id}`) as unknown as Promise<void>;
