import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('devopshub_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('devopshub_token') || null);
  const [loading, setLoading] = useState(true);

  // Check auth session on startup
  useEffect(() => {
    const verifyAuth = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get('/auth/me');
        if (response.data.success && response.data.user) {
          setUser(response.data.user);
          localStorage.setItem('devopshub_user', JSON.stringify(response.data.user));
        }
      } catch (err) {
        console.warn('Session verification failed, logging out:', err.message);
        logout();
      } finally {
        setLoading(false);
      }
    };

    verifyAuth();
  }, [token]);

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.success) {
      const { token: newToken, user: userData } = response.data;
      setToken(newToken);
      setUser(userData);
      localStorage.setItem('devopshub_token', newToken);
      localStorage.setItem('devopshub_user', JSON.stringify(userData));
      return { success: true, user: userData };
    }
    return { success: false, message: response.data.message };
  };

  const signup = async (name, email, password, role) => {
    const response = await api.post('/auth/signup', { name, email, password, role });
    if (response.data.success) {
      const { token: newToken, user: userData } = response.data;
      setToken(newToken);
      setUser(userData);
      localStorage.setItem('devopshub_token', newToken);
      localStorage.setItem('devopshub_user', JSON.stringify(userData));
      return { success: true, user: userData };
    }
    return { success: false, message: response.data.message };
  };

  const logout = () => {
    try {
      api.post('/auth/logout').catch(() => {});
    } catch {}
    setToken(null);
    setUser(null);
    localStorage.removeItem('devopshub_token');
    localStorage.removeItem('devopshub_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(token && user),
        loading,
        login,
        signup,
        logout,
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
