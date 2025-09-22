import axios from 'axios';
import { cookieUtils } from '../utils/cookies';

// Create axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true, // Important for cross-origin requests with cookies
  timeout: 10000 // 10 second timeout
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // Try to get token from cookie first, then localStorage for backward compatibility
    const token = cookieUtils.getCookie('token') || localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config.url.includes('/auth/login')) {
      // Token expired or invalid (but don't redirect on login failures)
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      cookieUtils.deleteCookie('token');
      cookieUtils.deleteCookie('user');
      
      // Check if we're already on a public page to avoid unnecessary redirects
      const currentPath = window.location.pathname;
      const publicPaths = ['/', '/login', '/register'];
      
      if (!publicPaths.includes(currentPath)) {
        // Only redirect if we're on a protected page
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
