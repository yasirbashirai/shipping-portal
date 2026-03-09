import axios from 'axios';
import { useAuthStore } from '../store/authStore.js';
import * as mockData from './mockData.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Check if running in demo mode
 */
export const isDemoMode = () => localStorage.getItem('demoMode') === 'true';

/**
 * Mock response helper
 */
const mockResponse = (data) => Promise.resolve({ data });

/**
 * Mock API handlers for demo mode
 */
const mockHandlers = {
  'GET /api/dashboard/stats': () => mockResponse(mockData.dashboardStats),
  'GET /api/orders': () => mockResponse(mockData.orders),
  'GET /api/customers': () => mockResponse(mockData.customers),
  'GET /api/tracking': () => mockResponse(mockData.trackingOrders),
  'POST /api/auth/logout': () => mockResponse({ success: true }),
};

/**
 * Resolve mock handler by matching method + URL path
 */
function findMockHandler(method, url) {
  const path = url.replace(API_URL, '').split('?')[0];
  const key = `${method.toUpperCase()} ${path}`;

  // Exact match
  if (mockHandlers[key]) return mockHandlers[key];

  // Match order detail: GET /api/orders/:id
  if (method.toUpperCase() === 'GET' && /^\/api\/orders\/[^/]+$/.test(path)) {
    const order = mockData.orders.orders[0];
    return () => mockResponse(order);
  }

  // Match customer detail: GET /api/customers/:id
  if (method.toUpperCase() === 'GET' && /^\/api\/customers\/[^/]+$/.test(path)) {
    const customer = { ...mockData.customers.customers[0], orders: mockData.orders.orders.slice(0, 2) };
    return () => mockResponse(customer);
  }

  // Fallback for PATCH/POST operations
  if (['PATCH', 'POST'].includes(method.toUpperCase())) {
    return () => mockResponse({ success: true });
  }

  return null;
}

/**
 * Axios instance with JWT interceptors for authenticated API calls
 * Automatically attaches access token and handles token refresh on 401
 */
const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — attach access token, intercept in demo mode
api.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  // In demo mode, intercept and return mock data
  if (isDemoMode()) {
    const fullUrl = `${config.baseURL}${config.url}`;
    const handler = findMockHandler(config.method, fullUrl);
    if (handler) {
      const source = axios.CancelToken.source();
      config.cancelToken = source.token;
      handler().then((res) => {
        config._mockResponse = res;
      });
      // Use adapter override to return mock
      config.adapter = () => {
        return handler().then((res) => ({
          data: res.data,
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
        }));
      };
    }
  }

  return config;
});

// Response interceptor — handle token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // In demo mode, don't try to refresh
    if (isDemoMode()) return Promise.reject(error);

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
