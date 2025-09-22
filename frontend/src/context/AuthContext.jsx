import React, { useState, useEffect } from 'react';
import { AuthContext } from './contexts';
import { authService } from '../services';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedToken = authService.getStoredToken();
        const storedUser = authService.getStoredUser();
        
        if (storedToken && storedUser) {
          // If we have both token and user data, set them immediately
          setUser(storedUser);
          setToken(storedToken);
          
          // Then verify the token is still valid in the background
          try {
            const userData = await authService.getCurrentUser();
            // Update user data if token is valid
            setUser(userData.user);
          } catch (error) {
            // Token is invalid, clear everything
            console.error('Token validation failed:', error);
            authService.logout();
            setUser(null);
            setToken(null);
          }
        } else if (storedToken) {
          // Try to get current user info with the token
          try {
            const userData = await authService.getCurrentUser();
            setUser(userData.user);
            setToken(storedToken);
          } catch (error) {
            console.error('Auth initialization error:', error);
            authService.logout();
            setUser(null);
            setToken(null);
          }
        } else {
          // No token, clear any stale user data
          setUser(null);
          setToken(null);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        authService.logout();
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []); // Remove token dependency to avoid infinite loops

  const login = async (credentials) => {
    const response = await authService.login(credentials);
    setUser(response.user);
    setToken(response.token);
    return response;
  };

  const register = async (userData) => {
    const response = await authService.register(userData);
    setUser(response.user);
    setToken(response.token);
    return response;
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setToken(null);
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading,
    isAuthenticated: !!user && !!token
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
