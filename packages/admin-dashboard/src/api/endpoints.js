import api from './client.js';

/**
 * Login with email and password
 * @param {{ email: string, password: string }} credentials
 */
export const login = (credentials) => api.post('/auth/login', credentials);

/**
 * Fetch dashboard statistics
 * @param {string} [sourceWebsite] - Optional website filter
 */
export const getDashboardStats = (sourceWebsite) =>
  api.get('/dashboard/stats', { params: sourceWebsite !== 'ALL' ? { sourceWebsite } : {} });

/**
 * Fetch paginated orders
 * @param {object} params - Query parameters (page, limit, status, sourceWebsite, search, etc.)
 */
export const getOrders = (params) => api.get('/orders', { params });

/**
 * Fetch single order details
 * @param {string} id - Order ID
 */
export const getOrder = (id) => api.get(`/orders/${id}`);

/**
 * Update order status
 * @param {string} id - Order ID
 * @param {string} status - New status
 */
export const updateOrderStatus = (id, status) => api.patch(`/orders/${id}/status`, { status });

/**
 * Add tracking number to order
 * @param {string} id - Order ID
 * @param {object} data - { trackingNumber, carrierBooked, estimatedDelivery? }
 */
export const updateTracking = (id, data) => api.patch(`/orders/${id}/tracking`, data);

/**
 * Update admin notes on order
 * @param {string} id - Order ID
 * @param {string} adminNotes - Notes text
 */
export const updateNotes = (id, adminNotes) => api.patch(`/orders/${id}/notes`, { adminNotes });

/**
 * Fetch paginated customers
 * @param {object} params - Query parameters
 */
export const getCustomers = (params) => api.get('/customers', { params });

/**
 * Fetch single customer with order history
 * @param {string} id - Customer ID
 */
export const getCustomer = (id) => api.get(`/customers/${id}`);

/**
 * Fetch orders needing tracking numbers
 */
export const getTrackingOrders = () => api.get('/tracking');

/**
 * Batch update tracking numbers
 * @param {object[]} updates - Array of { orderId, trackingNumber, carrierBooked }
 */
export const batchUpdateTracking = (updates) => api.post('/tracking/batch', { updates });

/**
 * Logout — invalidate refresh token
 * @param {string} refreshToken
 */
export const logout = (refreshToken) => api.post('/auth/logout', { refreshToken });
