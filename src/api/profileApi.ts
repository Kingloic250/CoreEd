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
    const { data } = await axiosInstance.get(API_PATHS.PROFILE);
    return data;
  },

  update: async (payload: ProfileUpdatePayload) => {
    const { data } = await axiosInstance.put(API_PATHS.PROFILE, payload);
    return data;
  },

  changePassword: async (payload: ChangePasswordPayload) => {
    const { data } = await axiosInstance.post(API_PATHS.CHANGE_PASSWORD, payload);
    return data;
  },
};
