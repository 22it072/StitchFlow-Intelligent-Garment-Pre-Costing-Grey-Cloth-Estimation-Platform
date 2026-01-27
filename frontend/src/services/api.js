import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// API Service Functions
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
};

export const yarnAPI = {
  getAll: (params) => api.get('/yarns', { params }),
  getOne: (id) => api.get(`/yarns/${id}`),
  create: (data) => api.post('/yarns', data),
  update: (id, data) => api.put(`/yarns/${id}`, data),
  delete: (id) => api.delete(`/yarns/${id}`),
};

export const estimateAPI = {
  getAll: (params) => api.get('/estimates', { params }),
  getOne: (id) => api.get(`/estimates/${id}`),
  create: (data) => api.post('/estimates', data),
  update: (id, data) => api.put(`/estimates/${id}`, data),
  delete: (id) => api.delete(`/estimates/${id}`),
  duplicate: (id, data) => api.post(`/estimates/${id}/duplicate`, data),
  revert: (id, version) => api.post(`/estimates/${id}/revert/${version}`),
  compare: (ids) => api.post('/estimates/compare', { estimateIds: ids }),
  calculate: (data) => api.post('/estimates/calculate', data),
  saveDraft: (data) => api.post('/estimates/draft', data),
  getDraft: () => api.get('/estimates/draft'),
  deleteDraft: () => api.delete('/estimates/draft'),
};

export const analyticsAPI = {
  getDashboard: () => api.get('/analytics/dashboard'),
  getYarnUsage: () => api.get('/analytics/yarn-usage'),
  getCostTrends: (period) => api.get('/analytics/cost-trends', { params: { period } }),
};

export const settingsAPI = {
  get: () => api.get('/settings'),
  update: (data) => api.put('/settings', data),
  reset: () => api.post('/settings/reset'),
};