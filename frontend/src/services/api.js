import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request interceptor: inject stored JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('devopshub_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle unauthorized errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const isAuthCheck = error.config.url.includes('/auth/me');
      if (!isAuthCheck) {
        localStorage.removeItem('devopshub_token');
        localStorage.removeItem('devopshub_user');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
