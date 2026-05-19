import axiosInstance from './axiosInstance';

const BASE = '/api/v1/claims';

export const getClaims = (params: { studentId?: string }) =>
  axiosInstance.get(BASE, { params }) as unknown as Promise<unknown[]>;

export const createClaim = (payload: unknown) =>
  axiosInstance.post(BASE, payload) as unknown as Promise<unknown>;

export const updateClaim = (id: string, data: Record<string, unknown>) =>
  axiosInstance.patch(`${BASE}/${id}`, data) as unknown as Promise<unknown>;
