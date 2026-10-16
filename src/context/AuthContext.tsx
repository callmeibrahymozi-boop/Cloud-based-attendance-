import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api, setToken, clearToken, getToken } from '../api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  quickLogin: (accountKey: 'admin' | 'dr_okonkwo' | 'prof_adeyemi' | 'ibrahim_musa' | 'ngozi_eze') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    const token = getToken();
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const data = await api.get<{ success: boolean; user: User }>('/auth/me');
      if (data.success && data.user) {
        setUser(data.user);
      } else {
        setUser(null);
        clearToken();
      }
    } catch {
      setUser(null);
      clearToken();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();

    const handleExpired = () => {
      setUser(null);
    };
    window.addEventListener('auth_expired', handleExpired);
    return () => window.removeEventListener('auth_expired', handleExpired);
  }, []);

  const login = async (identifier: string, password: string) => {
    setIsLoading(true);
    try {
      const data = await api.post<{ success: boolean; token: string; user: User }>('/auth/login', {
        identifier,
        password,
      });
      if (data.token) {
        setToken(data.token);
        setUser(data.user);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore
    } finally {
      clearToken();
      setUser(null);
    }
  };

  const quickLogin = async (accountKey: 'admin' | 'dr_okonkwo' | 'prof_adeyemi' | 'ibrahim_musa' | 'ngozi_eze') => {
    const accounts: Record<string, { id: string; pass: string }> = {
      admin: { id: 'admin', pass: 'Admin@12345' },
      dr_okonkwo: { id: 'dr_okonkwo', pass: 'Lecturer@12345' },
      prof_adeyemi: { id: 'prof_adeyemi', pass: 'Lecturer@12345' },
      ibrahim_musa: { id: 'ibrahim_musa', pass: 'Student@12345' },
      ngozi_eze: { id: 'ngozi_eze', pass: 'Student@12345' },
    };
    const target = accounts[accountKey];
    if (target) {
      await login(target.id, target.pass);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        refreshUser,
        quickLogin,
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
