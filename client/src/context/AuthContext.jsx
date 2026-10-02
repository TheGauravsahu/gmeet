import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('aura_meet_token') || null);
  const [isLoading, setIsLoading] = useState(true);
  const [guestName, setGuestNameState] = useState(
    localStorage.getItem('aura_meet_guest_name') || ''
  );

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('aura_meet_token');
      if (storedToken) {
        try {
          const res = await api.auth.getMe();
          if (res.success && res.data.user) {
            setUser(res.data.user);
          }
        } catch (err) {
          console.warn('Session expired or invalid, clearing token');
          localStorage.removeItem('aura_meet_token');
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await api.auth.login({ email, password });
    if (res.success && res.data.token) {
      localStorage.setItem('aura_meet_token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      return res.data;
    }
    throw new Error(res.message || 'Login failed');
  };

  const register = async (name, email, password) => {
    const res = await api.auth.register({ name, email, password });
    if (res.success && res.data.token) {
      localStorage.setItem('aura_meet_token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      return res.data;
    }
    throw new Error(res.message || 'Registration failed');
  };

  const logout = () => {
    localStorage.removeItem('aura_meet_token');
    setToken(null);
    setUser(null);
  };

  const setGuestName = (name) => {
    localStorage.setItem('aura_meet_guest_name', name);
    setGuestNameState(name);
  };

  const displayName = user ? user.name : guestName || 'Guest';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        guestName,
        displayName,
        setGuestName,
        login,
        register,
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
