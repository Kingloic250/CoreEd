// Announcements endpoints
import axiosInstance from './axiosInstance';

const BASE = '/api/v1/announcements';

export const getAnnouncements = (params?: { role?: string }) =>
  axiosInstance.get(BASE, { params }) as unknown as Promise<unknown[]>;

export const createAnnouncement = (payload: unknown) =>
  axiosInstance.post(BASE, payload) as unknown as Promise<unknown>;
