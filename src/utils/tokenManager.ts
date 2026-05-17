// In-memory token store for JWT access tokens.
//
// WHY NOT localStorage?
// - localStorage is accessible by any JavaScript on the page, making tokens
//   vulnerable to XSS attacks. If a script is injected (via a third-party lib,
//   a DOM XSS, etc.), it can steal the token and impersonate the user.
//
// WHY IN-MEMORY?
// - Module-scope memory is only accessible to our own JavaScript module. An
//   XSS attacker cannot reach the token via document, window, or storage APIs.
// - The trade-off: tokens are lost on page refresh. The recommended production
//   strategy is to pair in-memory access tokens with an HttpOnly cookie that
//   holds a refresh token. On refresh, POST /api/v1/auth/refresh → the server
//   reads the HttpOnly cookie, validates the refresh token, and issues a new
//   short-lived access token. The frontend stores that new token in memory only.
//
// PRODUCTION STRATEGY:
// - Access token → in-memory (this module), expires in 15 min
// - Refresh token → HttpOnly, Secure, SameSite=Strict cookie, expires in 7 days
// - On 401: call /api/v1/auth/refresh silently, retry original request

let _token: string | null = null;

export const getToken = (): string | null => _token;

export const setToken = (token: string): void => {
  _token = token;
};

export const clearToken = (): void => {
  _token = null;
};
