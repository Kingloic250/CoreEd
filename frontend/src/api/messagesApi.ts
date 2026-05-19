import axiosInstance from './axiosInstance';

const BASE = '/api/v1/messages';

export const getMessages = (params: { userId?: string; folder?: string }) =>
  axiosInstance.get(BASE, { params }) as unknown as Promise<unknown[]>;

export const getMessageById = (id: string) =>
  axiosInstance.get(`${BASE}/${id}`) as unknown as Promise<unknown>;

export const sendMessage = (payload: unknown) =>
  axiosInstance.post(BASE, payload) as unknown as Promise<unknown>;

export const markAsRead = (id: string) =>
  axiosInstance.patch(`${BASE}/${id}/read`) as unknown as Promise<unknown>;
