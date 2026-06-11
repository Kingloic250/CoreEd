import axiosInstance from './axiosInstance';

const BASE = '/api/v1/timetable';

export const getTimetable = (params?: { facultyId?: string; year?: string; semesterId?: string }) =>
  axiosInstance.get(BASE, { params }) as unknown as Promise<{
    id: string; courseId: string; day: number; startTime: string; endTime: string; roomId: string | null;
    course: { id: string; name: string; year: string | null; lecturerId: string | null };
    room: { id: string; name: string } | null;
  }[]>;

export const generateTimetable = (payload: {
  facultyId: string; semesterId?: string; daysOfWeek: number[];
  timeStart: string; timeEnd: string; periodDuration: number; periodsPerDay: number;
}) =>
  axiosInstance.post(`${BASE}/generate`, payload) as unknown as Promise<{
    entries: { courseId: string; day: number; startTime: string; endTime: string; roomId: string | null }[];
    total: number;
  }>;

export const applyTimetable = (entries: { courseId: string; day: number; startTime: string; endTime: string; roomId: string | null }[]) =>
  axiosInstance.post(`${BASE}/apply`, { entries }) as unknown as Promise<{ message: string; count: number }>;

export const createTimetableEntry = (payload: { courseId: string; day: number; startTime: string; endTime: string; roomId?: string }) =>
  axiosInstance.post(`${BASE}/entries`, payload) as unknown as Promise<unknown>;

export const updateTimetableEntry = (id: string, payload: unknown) =>
  axiosInstance.put(`${BASE}/entries/${id}`, payload) as unknown as Promise<unknown>;

export const deleteTimetableEntry = (id: string) =>
  axiosInstance.delete(`${BASE}/entries/${id}`) as unknown as Promise<void>;