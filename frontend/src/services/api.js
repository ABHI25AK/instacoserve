import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach JWT token to all outgoing requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// API helper functions
export const authApi = {
  getFederations: () => api.get('/auth/federations'),
  register: (data) => api.post('/auth/register', data),
  login: (credentials) => api.post('/auth/login', credentials),
  getMe: () => api.get('/auth/me')
};

export const bookingApi = {
  createBooking: (data) => api.post('/bookings', data),
  getMyBookings: () => api.get('/bookings/mine'),
  getBookingDetail: (id) => api.get(`/bookings/${id}`),
  updateStatus: (id, status) => api.patch(`/bookings/${id}/status`, { status }),
  payBooking: (id, data) => api.post(`/bookings/${id}/pay`, data),
  rateBooking: (id, data) => api.post(`/bookings/${id}/rate`, data),
  raiseDispute: (id, data) => api.post(`/bookings/${id}/dispute`, data)
};

export const workerApi = {
  toggleAvailability: (available, lat, lng) => api.patch('/workers/me/availability', { available, lat, lng }),
  getEarnings: () => api.get('/workers/me/earnings'),
  buySubscription: (days) => api.post('/workers/me/subscription', { days }),
  getWorkersList: (params) => api.get('/workers', { params }),
  verifyWorker: (userId, verified) => api.patch(`/workers/${userId}/verify`, { verified }),
  bulkImport: (workers) => api.post('/workers/bulk-import', { workers })
};

export const adminApi = {
  getOverview: () => api.get('/admin/overview'),
  getForecast: (category) => api.get('/admin/forecast', { params: { category } }),
  getDisputes: (status) => api.get('/admin/disputes', { params: { status } }),
  resolveDispute: (id, data) => api.patch(`/admin/disputes/${id}/resolve`, data),
  getWelfareFund: () => api.get('/admin/welfare-fund'),
  getTrainingFlags: () => api.get('/admin/training-flags')
};

export const aiApi = {
  searchIntent: (prompt) => api.post('/ai/search-intent', { prompt }),
  chat: (message, history, userId) => api.post('/ai/chat', { message, history, userId })
};

export default api;
