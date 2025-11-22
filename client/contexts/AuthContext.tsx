'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, LoginCredentials, RegisterData, AuthResponse, AuthContextType } from '@/types/auth.types';
import { authService } from '@/graphql/authService';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // load auth state from localStorage on mount
  useEffect(() => {
    const loadAuthState = async () => {
      try {
        const storedToken = localStorage.getItem('auth_token');
        const storedUser = localStorage.getItem('auth_user');

        if (storedToken && storedUser) {
          // check if token is expired
          if (!authService.isTokenExpired(storedToken)) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
          } else {
            // token expired, clear storage
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
          }
        }
      } catch (error) {
        console.error('Failed to load auth state:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAuthState();
  }, []);

  const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      const response = await authService.login(credentials);

      if (response.success && response.token && response.user) {
        setToken(response.token);
        setUser(response.user);

        // add to localStorage
        localStorage.setItem('auth_token', response.token);
        localStorage.setItem('auth_user', JSON.stringify(response.user));
      }

      return response;
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Login failed',
      };
    }
  };

  const register = async (data: RegisterData): Promise<AuthResponse> => {
    try {
      const response = await authService.register(data);

      if (response.success && response.token && response.user) {
        setToken(response.token);
        setUser(response.user);

        // Persist to localStorage
        localStorage.setItem('auth_token', response.token);
        localStorage.setItem('auth_user', JSON.stringify(response.user));
      }

      return response;
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Registration failed',
      };
    }
  };

  const logout = () => {
    authService.logout();
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    if (!token) return;

    try {
      const userData = await authService.getCurrentUser(token);
      if (userData) {
        setUser(userData);
        localStorage.setItem('auth_user', JSON.stringify(userData));
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    isLoading,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
