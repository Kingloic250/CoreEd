import axiosInstance from './axiosInstance';

export interface SendCodePayload {
  email: string;
}

export interface VerifyCodePayload {
  email: string;
  code: string;
}

export const sendVerificationCode = (payload: SendCodePayload): Promise<{ message: string }> =>
  axiosInstance.post('/api/v1/verify/send-code', payload) as unknown as Promise<{ message: string }>;

export const verifyCode = (payload: VerifyCodePayload): Promise<{ message: string }> =>
  axiosInstance.post('/api/v1/verify/verify-code', payload) as unknown as Promise<{ message: string }>;
