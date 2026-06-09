import axiosInstance from './axiosInstance';

const BASE = '/api/v1/materials';

export const getMaterials = (params?: { courseId?: string; type?: string }) =>
  axiosInstance.get(BASE, { params }) as unknown as Promise<unknown[]>;

export const getMaterialById = (id: string) =>
  axiosInstance.get(`${BASE}/${id}`) as unknown as Promise<unknown>;

export const createMaterial = (formData: FormData) =>
  axiosInstance.post(BASE, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }) as unknown as Promise<unknown>;

export const deleteMaterial = (id: string) =>
  axiosInstance.delete(`${BASE}/${id}`) as unknown as Promise<void>;
