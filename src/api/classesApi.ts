// Classes & schedules endpoints
import axiosInstance from './axiosInstance';

const BASE = '/api/v1/classes';

export const getAllClasses = () =>
  axiosInstance.get(BASE) as unknown as Promise<unknown[]>;

export const createClass = (payload: unknown) =>
  axiosInstance.post(BASE, payload) as unknown as Promise<unknown>;

export const updateClass = (id: string, payload: unknown) =>
  axiosInstance.put(`${BASE}/${id}`, payload) as unknown as Promise<unknown>;

export const deleteClass = (id: string) =>
  axiosInstance.delete(`${BASE}/${id}`) as unknown as Promise<void>;
