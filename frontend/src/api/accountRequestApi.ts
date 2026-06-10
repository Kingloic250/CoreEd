import axiosInstance from './axiosInstance';
import { API_PATHS } from '@/utils/constants';

export interface AccountRequest {
  id: string;
  name: string;
  email: string;
  studentId?: string;
  classOrSubject: string;
  message?: string;
  status: 'pending' | 'approved' | 'rejected';
  flagged: boolean;
  schoolEmail?: string;
  password?: string;
  createdAt: string;
  approvedAt?: string;
}

export interface SubmitRequestPayload {
  name: string;
  email: string;
  studentId: string;
  classOrSubject: string;
  message?: string;
}

export interface ApprovePayload {
  schoolEmail: string;
  password: string;
}

export const accountRequestApi = {
  getAll: async (): Promise<AccountRequest[]> => {
    return axiosInstance.get(API_PATHS.ACCOUNT_REQUESTS);
  },

  submit: async (payload: SubmitRequestPayload): Promise<AccountRequest> => {
    return axiosInstance.post(API_PATHS.ACCOUNT_REQUESTS, payload);
  },

  approve: async (id: string, payload: ApprovePayload): Promise<AccountRequest> => {
    return axiosInstance.put(`${API_PATHS.ACCOUNT_REQUESTS}/${id}/approve`, payload);
  },

  reject: async (id: string): Promise<AccountRequest> => {
    return axiosInstance.put(`${API_PATHS.ACCOUNT_REQUESTS}/${id}/reject`);
  },
};
