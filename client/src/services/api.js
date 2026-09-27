import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add JWT Bearer token if present
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('argo_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (data) => api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
};

export const queryApi = {
  submitQuery: (query, context = null) => api.post('/query', { query, context }),
  queryKnowledge: (query) => api.post('/query/knowledge', { query }),
  getKnowledgeSources: () => api.get('/query/knowledge/sources'),
};

export const dataApi = {
  getMetadata: () => api.get('/data/metadata'),
  search: (params) => api.post('/data/search', params),
  getFloatTracks: (region) => api.get('/data/floats', { params: { region } }),
};

export const historyApi = {
  getHistory: () => api.get('/history'),
  deleteItem: (id) => api.delete(`/history/${id}`),
  clearAll: () => api.delete('/history'),
};

export default api;
