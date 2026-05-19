// Auth endpoints: login, logout, refresh
//
// RATE LIMITING AWARENESS:
// The login endpoint should be rate-limited on the backend using express-rate-limit
// to prevent brute-force attacks (e.g., max 5 attempts per 15 minutes per IP).
// The frontend should handle 429 responses with exponential backoff:
//   retryAfter = Math.pow(2, attemptCount) * 1000 ms
// Display a "Too many attempts, please wait X seconds" message to the user.

import axiosInstance from './axiosInstance';
import { API_PATHS } from '@/utils/constants';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar: string | null;
  verified: boolean;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export const login = (payload: LoginPayload): Promise<LoginResponse> =>
  axiosInstance.post(API_PATHS.LOGIN, payload) as unknown as Promise<LoginResponse>;

export const logout = (): Promise<void> =>
  axiosInstance.post(API_PATHS.LOGOUT) as unknown as Promise<void>;
