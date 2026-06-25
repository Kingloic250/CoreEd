import axiosInstance from './axiosInstance';

const BASE = '/api/v1/system-settings';

export const getSettings = () =>
  axiosInstance.get(BASE) as unknown as Promise<Record<string, unknown>>;

export const updateSettings = (settings: Record<string, unknown>) =>
  axiosInstance.put(BASE, settings) as unknown as Promise<Record<string, unknown>>;
