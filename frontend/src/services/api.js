// frontend/src/services/api.js
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
    
    // Add company ID header if available
    const activeCompanyId = localStorage.getItem('activeCompanyId');
    if (activeCompanyId) {
      config.headers['X-Company-Id'] = activeCompanyId;
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
      localStorage.removeItem('activeCompanyId');
      window.location.href = '/login';
    }
    
    if (error.response?.status === 403) {
      console.error('Permission denied:', error.response?.data?.message);
    }
    
    return Promise.reject(error);
  }
);

export default api;

// ============ AUTH API ============
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
};

// ============ COMPANY API ============
export const companyAPI = {
  create: (data) => api.post('/companies', data),
  join: (companyCode) => api.post('/companies/join', { companyCode }),
  getAll: () => api.get('/companies'),
  getOne: (companyId) => api.get(`/companies/${companyId}`),
  update: (companyId, data) => api.put(`/companies/${companyId}`, data),
  regenerateCode: (companyId) => api.post(`/companies/${companyId}/regenerate-code`),
  leave: (companyId) => api.post(`/companies/${companyId}/leave`),
  delete: (companyId) => api.delete(`/companies/${companyId}`),
  getUsers: (companyId, params) => api.get(`/companies/${companyId}/users`, { params }),
  getUserStats: (companyId) => api.get(`/companies/${companyId}/users/stats`),
  changeUserRole: (companyId, userId, role) =>
    api.put(`/companies/${companyId}/users/${userId}/role`, { role }),
  removeUser: (companyId, userId) =>
    api.delete(`/companies/${companyId}/users/${userId}`),
  transferOwnership: (companyId, newOwnerId) =>
    api.post(`/companies/${companyId}/transfer-ownership`, { newOwnerId }),
};

// ============ YARN API ============
export const yarnAPI = {
  getAll: (params) => api.get('/yarns', { params }),
  getOne: (id) => api.get(`/yarns/${id}`),
  create: (data) => api.post('/yarns', data),
  update: (id, data) => api.put(`/yarns/${id}`, data),
  delete: (id) => api.delete(`/yarns/${id}`),
  getStats: () => api.get('/yarns/stats'),
};

// ============ ESTIMATE API ============
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

// ============ ANALYTICS API ============
export const analyticsAPI = {
  getDashboard: () => api.get('/analytics/dashboard'),
  getYarnUsage: () => api.get('/analytics/yarn-usage'),
  getCostTrends: (period) => api.get('/analytics/cost-trends', { params: { period } }),
};

// ============ SETTINGS API ============
export const settingsAPI = {
  get: () => api.get('/settings'),
  update: (data) => api.put('/settings', data),
  reset: () => api.post('/settings/reset'),
};

// ============ PRODUCTION API (Existing) ============
export const productionAPI = {
  getAll: (params) => api.get('/productions', { params }),
  getOne: (id) => api.get(`/productions/${id}`),
  create: (data) => api.post('/productions', data),
  update: (id, data) => api.put(`/productions/${id}`, data),
  delete: (id) => api.delete(`/productions/${id}`),
  calculate: (data) => api.post('/productions/calculate', data),
  getStats: () => api.get('/productions/stats'),
  getAnalytics: (params) => api.get('/productions/analytics', { params }),
};

// ============ NEW: LOOM API ============
export const loomAPI = {
  getAll: (params) => api.get('/looms', { params }),
  getOne: (id) => api.get(`/looms/${id}`),
  create: (data) => api.post('/looms', data),
  update: (id, data) => api.put(`/looms/${id}`, data),
  delete: (id) => api.delete(`/looms/${id}`),
  updateStatus: (id, data) => api.patch(`/looms/${id}/status`, data),
  assignBeam: (id, data) => api.post(`/looms/${id}/assign-beam`, data),
  getStats: () => api.get('/looms/stats'),
};

// ============ NEW: PRODUCTION LOG API ============
export const productionLogAPI = {
  getAll: (params) => api.get('/production-logs', { params }),
  getOne: (id) => api.get(`/production-logs/${id}`),
  create: (data) => api.post('/production-logs', data),
  update: (id, data) => api.put(`/production-logs/${id}`, data),
  delete: (id) => api.delete(`/production-logs/${id}`),
  getStats: (params) => api.get('/production-logs/stats', { params }),
};

// ============ NEW: YARN STOCK API ============
export const yarnStockAPI = {
  getAll: (params) => api.get('/yarn-stocks', { params }),
  getOne: (id) => api.get(`/yarn-stocks/${id}`),
  create: (data) => api.post('/yarn-stocks', data),
  receive: (id, data) => api.post(`/yarn-stocks/${id}/receive`, data),
  issue: (id, data) => api.post(`/yarn-stocks/${id}/issue`, data),
  return: (id, data) => api.post(`/yarn-stocks/${id}/return`, data),
  recordWastage: (id, data) => api.post(`/yarn-stocks/${id}/wastage`, data),
  getTransactions: (id, params) => api.get(`/yarn-stocks/${id}/transactions`, { params }),
  getStats: () => api.get('/yarn-stocks/stats'),
};

// ============ WARP BEAM API ============
export const warpBeamAPI = {
  getAll: (params) => api.get('/warp-beams', { params }),
  getOne: (id) => api.get(`/warp-beams/${id}`),
  create: (data) => api.post('/warp-beams', data),
  update: (id, data) => api.put(`/warp-beams/${id}`, data),
  delete: (id) => api.delete(`/warp-beams/${id}`),
  assign: (id, data) => api.post(`/warp-beams/${id}/assign`, data),
  remove: (id, data) => api.post(`/warp-beams/${id}/remove`, data),
  consume: (id, data) => api.post(`/warp-beams/${id}/consume`, data),
  getStats: () => api.get('/warp-beams/stats'),
};

// ============ NEW: FABRIC ROLL API ============
export const fabricRollAPI = {
  getAll: (params) => api.get('/fabric-rolls', { params }),
  getOne: (id) => api.get(`/fabric-rolls/${id}`),
  create: (data) => api.post('/fabric-rolls', data),
  updateStatus: (id, data) => api.patch(`/fabric-rolls/${id}/status`, data),
  dispatch: (id, data) => api.post(`/fabric-rolls/${id}/dispatch`, data),
  getStats: (params) => api.get('/fabric-rolls/stats', { params }),
};