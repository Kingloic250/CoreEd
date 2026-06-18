import axiosInstance from './axiosInstance';

const BASE = '/api/v1/groups';

export const getGroups = (params?: { courseId?: string; semesterId?: string; lecturerId?: string }) =>
  axiosInstance.get(BASE, { params }) as unknown as Promise<{
    id: string; name: string; courseId: string; semesterId: string | null; lecturerId: string | null;
    roomId: string | null; capacity: number; schedule: unknown; enrolledStudentIds: string[];
    enrolledCount: number;
    course: { id: string; name: string; credits: number };
    lecturer: { id: string; firstName: string; lastName: string } | null;
    room: { id: string; name: string; code: string | null } | null;
    semester: { id: string; name: string; year: string } | null;
  }[]>;

export const getGroup = (id: string) =>
  axiosInstance.get(`${BASE}/${id}`) as unknown as Promise<Record<string, unknown>>;

export const createGroup = (payload: unknown) =>
  axiosInstance.post(BASE, payload) as unknown as Promise<Record<string, unknown>>;

export const updateGroup = (id: string, payload: unknown) =>
  axiosInstance.put(`${BASE}/${id}`, payload) as unknown as Promise<Record<string, unknown>>;

export const deleteGroup = (id: string) =>
  axiosInstance.delete(`${BASE}/${id}`) as unknown as Promise<void>;

export const bulkCreateGroups = (entries: { courseId: string; groups: { name: string; period: 'day' | 'night' }[] }[]) =>
  axiosInstance.post(`${BASE}/bulk`, { entries }) as unknown as Promise<{
    created: Record<string, unknown>[]; errors?: { courseId: string; message: string }[]; total: number;
  }>;
