const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const api = {
  async request(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'An error occurred' }));
      throw new Error(error.error || 'An error occurred');
    }

    return response.json();
  },

  auth: {
    register: (data) => api.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    login: (data) => api.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    enable2FA: () => api.request('/api/auth/2fa/enable', {
      method: 'POST',
    }),
    verify2FA: (data) => api.request('/api/auth/2fa/verify', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    disable2FA: (data) => api.request('/api/auth/2fa/disable', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    changePassword: (data) => api.request('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  },

  licenses: {
    generate: (data) => api.request('/api/licenses/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    getAll: (params) => api.request(`/api/licenses?${new URLSearchParams(params)}`),
    getById: (id) => api.request(`/api/licenses/${id}`),
    activate: (data) => api.request('/api/licenses/activate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    extend: (id, data) => api.request(`/api/licenses/${id}/extend`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    block: (id, data) => api.request(`/api/licenses/${id}/block`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    unblock: (id) => api.request(`/api/licenses/${id}/unblock`, {
      method: 'POST',
    }),
    delete: (id) => api.request(`/api/licenses/${id}`, {
      method: 'DELETE',
    }),
    export: (format, status) => api.request(`/api/licenses/export/${format}?status=${status}`),
  },

  hwid: {
    reset: (licenseId, data) => api.request(`/api/hwid/${licenseId}/reset`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    getHistory: (licenseId) => api.request(`/api/hwid/${licenseId}/history`),
  },

  users: {
    getAll: (params) => api.request(`/api/users?${new URLSearchParams(params)}`),
    getById: (id) => api.request(`/api/users/${id}`),
    updateRole: (id, data) => api.request(`/api/users/${id}/role`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
    delete: (id) => api.request(`/api/users/${id}`, {
      method: 'DELETE',
    }),
    getLoginHistory: (id, params) => api.request(`/api/users/${id}/login-history?${new URLSearchParams(params)}`),
  },

  dashboard: {
    getStats: () => api.request('/api/dashboard/stats'),
    getAuditLogs: (params) => api.request(`/api/dashboard/audit-logs?${new URLSearchParams(params)}`),
  },

  api: {
    validate: (data) => api.request('/api/validate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    getInfo: (data) => api.request('/api/info', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    resetHWID: (data) => api.request('/api/reset-hwid', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  },
};

export default api;
