const STORAGE_KEY = 'auth_token';

let _token: string | null = (() => {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
})();

export const getToken = (): string | null => _token;

export const setToken = (token: string): void => {
  _token = token;
  try {
    localStorage.setItem(STORAGE_KEY, token);
  } catch {
    // localStorage unavailable
  }
};

export const clearToken = (): void => {
  _token = null;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // localStorage unavailable
  }
};
