import axiosInstance from './axiosInstance';
import { API_PATHS } from '@/utils/constants';

export interface ProfileUpdatePayload {
  name?: string;
  email?: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export const profileApi = {
  get: async () => {
    return axiosInstance.get(API_PATHS.PROFILE);
  },

  update: async (payload: ProfileUpdatePayload) => {
    return axiosInstance.put(API_PATHS.PROFILE, payload);
  },

  changePassword: async (payload: ChangePasswordPayload) => {
    return axiosInstance.post(API_PATHS.CHANGE_PASSWORD, payload);
  },

  uploadAvatar: async (formData: FormData) => {
    return axiosInstance.post(`${API_PATHS.PROFILE}/avatar`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
