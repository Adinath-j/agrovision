import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check stored auth session on initial app load
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('agrovision_access_token');
      const cachedUser = localStorage.getItem('agrovision_user');

      if (token && cachedUser) {
        try {
          setUser(JSON.parse(cachedUser));
          // Verify with backend
          const res = await authService.getProfile();
          setUser(res.data);
          localStorage.setItem('agrovision_user', JSON.stringify(res.data));
        } catch (err) {
          console.error("Session verification failed, logging out:", err);
          logout();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (username, password) => {
    setError(null);
    try {
      const res = await authService.login({ username, password });
      const { access, refresh, user: userData } = res.data;

      localStorage.setItem('agrovision_access_token', access);
      localStorage.setItem('agrovision_refresh_token', refresh);
      localStorage.setItem('agrovision_user', JSON.stringify(userData));

      setUser(userData);
      return { success: true, user: userData };
    } catch (err) {
      let msg = 'Login failed. Please check credentials.';
      if (!err.response) {
        msg = 'Backend server unreachable. Please verify Django is running at http://127.0.0.1:8000 (run: cd backend && python manage.py runserver 8000).';
      } else if (err.response.data) {
        if (typeof err.response.data === 'string') {
          msg = err.response.data;
        } else if (err.response.data.detail) {
          msg = err.response.data.detail;
        } else if (err.response.data.non_field_errors) {
          msg = Array.isArray(err.response.data.non_field_errors)
            ? err.response.data.non_field_errors.join(' ')
            : err.response.data.non_field_errors;
        } else {
          msg = Object.entries(err.response.data)
            .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(' ') : errors}`)
            .join(' | ');
        }
      }
      setError(msg);
      return { success: false, error: msg };
    }
  };

  const register = async (userData) => {
    setError(null);
    try {
      const res = await authService.register(userData);
      return { success: true, message: res.data.message };
    } catch (err) {
      let errorMsg = 'Registration failed.';
      if (!err.response) {
        errorMsg = 'Backend server unreachable. Please verify Django is running at http://127.0.0.1:8000 (run: cd backend && python manage.py runserver 8000).';
      } else if (err.response.data) {
        if (typeof err.response.data === 'string') {
          errorMsg = err.response.data;
        } else if (err.response.data.detail) {
          errorMsg = err.response.data.detail;
        } else if (err.response.data.message) {
          errorMsg = err.response.data.message;
        } else {
          errorMsg = Object.entries(err.response.data)
            .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(' ') : errors}`)
            .join(' | ');
        }
      }
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  };

  const logout = () => {
    localStorage.removeItem('agrovision_access_token');
    localStorage.removeItem('agrovision_refresh_token');
    localStorage.removeItem('agrovision_user');
    setUser(null);
  };

  const refreshUserProfile = async () => {
    try {
      const res = await authService.getProfile();
      setUser(res.data);
      localStorage.setItem('agrovision_user', JSON.stringify(res.data));
    } catch (err) {
      console.error("Failed to refresh user profile", err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
