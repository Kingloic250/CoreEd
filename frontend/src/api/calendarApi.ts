import axiosInstance from './axiosInstance';

const BASE = '/api/v1/calendar-events';

export const getCalendarEvents = (params?: {
  type?: string;
  startDate?: string;
  endDate?: string;
}) => axiosInstance.get(BASE, { params }) as unknown as Promise<unknown[]>;

export const getCalendarEventById = (id: string) =>
  axiosInstance.get(`${BASE}/${id}`) as unknown as Promise<unknown>;

export const createCalendarEvent = (data: Record<string, unknown>) =>
  axiosInstance.post(BASE, data) as unknown as Promise<unknown>;

export const updateCalendarEvent = (id: string, data: Record<string, unknown>) =>
  axiosInstance.put(`${BASE}/${id}`, data) as unknown as Promise<unknown>;

export const deleteCalendarEvent = (id: string) =>
  axiosInstance.delete(`${BASE}/${id}`) as unknown as Promise<void>;
