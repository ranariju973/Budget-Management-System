import api from './api';
import { cookieUtils } from '../utils/cookies';

// Auth service
export const authService = {
  // Register new user
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    if (response.data.token) {
      // Store token and user data in cookies for 7 days
      cookieUtils.setCookie('token', response.data.token, 7);
      cookieUtils.setCookie('user', JSON.stringify(response.data.user), 7);
    }
    return response.data;
  },

  // Login user
  login: async (credentials) => {
    console.log('Login attempt with:', credentials);
    console.log('API URL:', api.defaults.baseURL);
    try {
      const response = await api.post('/auth/login', credentials);
      console.log('Login response:', response.data);
      if (response.data.token) {
        // Store token and user data in cookies for 7 days
        cookieUtils.setCookie('token', response.data.token, 7);
        cookieUtils.setCookie('user', JSON.stringify(response.data.user), 7);
        
        // Also keep localStorage for backward compatibility (can be removed later)
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      console.error('Error response:', error.response?.data);
      throw error;
    }
  },

  // Get current user
  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  // Logout
  logout: () => {
    // Remove from both cookies and localStorage
    cookieUtils.deleteCookie('token');
    cookieUtils.deleteCookie('user');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // Check if user is logged in
  isLoggedIn: () => {
    // Check both cookie and localStorage for token
    return !!(cookieUtils.getCookie('token') || localStorage.getItem('token'));
  },

  // Get stored user
  getStoredUser: () => {
    // Try to get user from cookie first, then localStorage
    let user = cookieUtils.getCookie('user');
    if (!user) {
      user = localStorage.getItem('user');
    }
    return user ? JSON.parse(user) : null;
  },

  // Get stored token
  getStoredToken: () => {
    // Try to get token from cookie first, then localStorage
    return cookieUtils.getCookie('token') || localStorage.getItem('token');
  }
};

// Budget service
export const budgetService = {
  // Create new budget
  create: async (budgetData) => {
    const response = await api.post('/budgets', budgetData);
    return response.data;
  },

  // Get all budgets
  getAll: async () => {
    const response = await api.get('/budgets');
    return response.data;
  },

  // Get budget by ID
  getById: async (id) => {
    const response = await api.get(`/budgets/${id}`);
    return response.data;
  },

  // Update budget
  update: async (id, budgetData) => {
    const response = await api.put(`/budgets/${id}`, budgetData);
    return response.data;
  },

  // Delete budget
  delete: async (id) => {
    const response = await api.delete(`/budgets/${id}`);
    return response.data;
  },

  // Get budget summary
  getSummary: async (id) => {
    const response = await api.get(`/budgets/${id}/summary`);
    return response.data;
  }
};

// Expense service
export const expenseService = {
  // Create new expense
  create: async (expenseData) => {
    const response = await api.post('/expenses', expenseData);
    return response.data;
  },

  // Get expenses
  getAll: async (params = {}) => {
    const response = await api.get('/expenses', { params });
    return response.data;
  },

  // Get expense by ID
  getById: async (id) => {
    const response = await api.get(`/expenses/${id}`);
    return response.data;
  },

  // Update expense
  update: async (id, expenseData) => {
    const response = await api.put(`/expenses/${id}`, expenseData);
    return response.data;
  },

  // Delete expense
  delete: async (id) => {
    const response = await api.delete(`/expenses/${id}`);
    return response.data;
  }
};

// Borrowing service
export const borrowingService = {
  // Create new borrowing
  create: async (borrowingData) => {
    const response = await api.post('/borrowings', borrowingData);
    return response.data;
  },

  // Get borrowings
  getAll: async (params = {}) => {
    const response = await api.get('/borrowings', { params });
    return response.data;
  },

  // Get borrowing by ID
  getById: async (id) => {
    const response = await api.get(`/borrowings/${id}`);
    return response.data;
  },

  // Update borrowing
  update: async (id, borrowingData) => {
    const response = await api.put(`/borrowings/${id}`, borrowingData);
    return response.data;
  },

  // Delete borrowing
  delete: async (id) => {
    const response = await api.delete(`/borrowings/${id}`);
    return response.data;
  },

  // Mark as repaid
  markRepaid: async (id) => {
    const response = await api.put(`/borrowings/${id}/repay`);
    return response.data;
  }
};

// Lending service (money you've lent to others)
export const lendingService = {
  // Get all lendings
  getAll: async (params = {}) => {
    const response = await api.get('/lendings', { params });
    return response.data;
  },

  // Get lending by ID
  getById: async (id) => {
    const response = await api.get(`/lendings/${id}`);
    return response.data;
  },

  // Create new lending
  create: async (lendingData) => {
    const response = await api.post('/lendings', lendingData);
    return response.data;
  },

  // Update lending
  update: async (id, lendingData) => {
    const response = await api.put(`/lendings/${id}`, lendingData);
    return response.data;
  },

  // Delete lending
  delete: async (id) => {
    const response = await api.delete(`/lendings/${id}`);
    return response.data;
  },

  // Mark lending as repaid
  markRepaid: async (id) => {
    const response = await api.put(`/lendings/${id}/repay`);
    return response.data;
  }
};

// Export all services
export default {
  auth: authService,
  budgets: budgetService,
  expenses: expenseService,
  borrowings: borrowingService,
  lendings: lendingService
};
