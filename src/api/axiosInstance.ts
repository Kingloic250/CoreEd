// Axios base instance with request/response interceptors.
//
// CSRF AWARENESS (production):
// When switching from Bearer tokens to cookie-based auth, all mutating requests
// (POST, PUT, DELETE, PATCH) must include a CSRF token header, e.g.:
//   'X-CSRF-Token': getCsrfToken()
// The Express backend must validate this header via csurf or a custom middleware.
// The CSRF token itself can be embedded in the HTML or fetched via a GET endpoint.

import axios from 'axios';
import { getToken, clearToken } from '@/utils/tokenManager';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000',
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: attach Bearer token from in-memory store
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: normalize responses and handle auth errors
axiosInstance.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status = error.response?.status;
    const message =
      error.response?.data?.message ?? error.message ?? 'An unexpected error occurred';

    if (status === 401) {
      clearToken();
      // Import lazily to avoid circular dependency with authStore
      import('@/store/authStore').then(({ useAuthStore }) => {
        useAuthStore.getState().logout();
      });
      window.location.href = '/login';
      return Promise.reject({ message, status, errors: [] });
    }

    return Promise.reject({
      message,
      status: status ?? 0,
      errors: error.response?.data?.errors ?? [],
    });
  }
);

export default axiosInstance;
