import axios from 'axios';
import { useAuthStore } from '../store/authStore.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Axios instance with JWT interceptors for authenticated API calls
 * Automatically attaches access token and handles token refresh on 401
 */
const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — attach access token
api.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Response interceptor — handle token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const { refreshToken, updateAccessToken, logout } = useAuthStore.getState();

      if (!refreshToken) {
        logout();
        return Promise.reject(error);
      }

      try {
        const res = await axios.post(`${API_URL}/api/auth/refresh`, { refreshToken });
        const { accessToken: newToken, refreshToken: newRefresh } = res.data;

        updateAccessToken(newToken);
        localStorage.setItem('refreshToken', newRefresh);
        useAuthStore.setState({ refreshToken: newRefresh });

        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch {
        logout();
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
