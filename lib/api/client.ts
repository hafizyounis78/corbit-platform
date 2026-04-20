import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const lang = localStorage.getItem('lang') || 'ar';
    config.headers['Accept-Language'] = lang;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== 'undefined') {
      if (error.response?.status === 401) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      } else if (
        error.response?.status === 423 &&
        error.response?.data?.code === 'PASSWORD_CHANGE_REQUIRED' &&
        !window.location.pathname.includes('/auth/change-password')
      ) {
        window.location.href = '/auth/change-password';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
