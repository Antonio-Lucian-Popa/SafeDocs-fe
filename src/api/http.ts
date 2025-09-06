import axios, { AxiosError } from 'axios';
import { TokenPair } from './types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export const httpClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: false,
});

let authTokens: { accessToken: string | null; refreshToken: string | null } = {
  accessToken: null,
  refreshToken: null,
};

// Set tokens from auth context
export const setAuthTokens = (tokens: { accessToken: string | null; refreshToken: string | null }) => {
  authTokens = tokens;
};

// Request interceptor to add auth header
httpClient.interceptors.request.use(
  (config) => {
    if (authTokens.accessToken) {
      config.headers.Authorization = `Bearer ${authTokens.accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
httpClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      if (authTokens.refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken: authTokens.refreshToken,
          });

          const newTokens: TokenPair = response.data;
          authTokens.accessToken = newTokens.accessToken;
          authTokens.refreshToken = newTokens.refreshToken;
          localStorage.setItem('refreshToken', newTokens.refreshToken);

          // Notify auth context about new tokens
          window.dispatchEvent(new CustomEvent('tokens-refreshed', {
            detail: newTokens
          }));

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
          return httpClient(originalRequest);
        } catch (refreshError) {
          // Refresh failed, logout user
          localStorage.removeItem('refreshToken');
          authTokens.accessToken = null;
          authTokens.refreshToken = null;
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }
    }

    return Promise.reject(error);
  }
);

export { API_BASE_URL };