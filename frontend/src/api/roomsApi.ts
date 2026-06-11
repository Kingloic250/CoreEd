import axiosInstance from './axiosInstance';

const BASE = '/api/v1/rooms';

export const getRooms = () =>
  axiosInstance.get(BASE) as unknown as Promise<{
    id: string; name: string; code: string | null; capacity: number; building: string | null; description: string | null;
  }[]>;

export const createRoom = (payload: unknown) =>
  axiosInstance.post(BASE, payload) as unknown as Promise<unknown>;

export const updateRoom = (id: string, payload: unknown) =>
  axiosInstance.put(`${BASE}/${id}`, payload) as unknown as Promise<unknown>;

export const deleteRoom = (id: string) =>
  axiosInstance.delete(`${BASE}/${id}`) as unknown as Promise<void>;