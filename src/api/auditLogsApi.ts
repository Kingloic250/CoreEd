import axiosInstance from './axiosInstance';
import { API_PATHS } from '@/utils/constants';

const BASE = API_PATHS.AUDIT_LOGS;

export const getAllAuditLogs = () =>
  axiosInstance.get(BASE) as unknown as Promise<unknown[]>;
