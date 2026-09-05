import React, { createContext, useContext, useEffect, useState } from 'react';
import { fetchAuthMe, logout as apiLogout, demoLogin as apiDemoLogin, setStoredAuthToken } from '../lib/api';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: {
    kickUserId: string;
    username: string;
    avatarUrl: string;
    role: 'admin' | 'user';
  } | null;
  isAdmin: boolean;
  refreshUser: () => Promise<void>;
  loginAsDemo: (role?: 'admin' | 'user', username?: string) => Promise<void>;
  logout: () => Promise<void>;
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const refreshUser = async () => {
    try {
      const data = await fetchAuthMe();
      setIsAuthenticated(data.isAuthenticated);
      setUser(data.user);
      setIsAdmin(data.isAdmin);
    } catch (err) {
      console.error('Failed refreshing auth user:', err);
      setIsAuthenticated(false);
      setUser(null);
      setIsAdmin(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Check if token or auth_success returned in URL query parameters
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const urlToken = searchParams.get('token');
      const authSuccess = searchParams.get('auth_success') || searchParams.get('auth');
      
      if (urlToken) {
        setStoredAuthToken(urlToken);
        searchParams.delete('token');
        searchParams.delete('auth_success');
        searchParams.delete('auth');
        const remainingQuery = searchParams.toString() ? `?${searchParams.toString()}` : '';
        window.history.replaceState({}, '', `${window.location.pathname}${remainingQuery}${window.location.hash}`);
      } else if (authSuccess) {
        searchParams.delete('auth_success');
        searchParams.delete('auth');
        const remainingQuery = searchParams.toString() ? `?${searchParams.toString()}` : '';
        window.history.replaceState({}, '', `${window.location.pathname}${remainingQuery}${window.location.hash}`);
      }
    } catch (e) {
      console.error('Error parsing auth URL params:', e);
    }

    refreshUser();
  }, []);

  const loginAsDemo = async (role: 'admin' | 'user' = 'user', username?: string) => {
    setIsLoading(true);
    try {
      const data = await apiDemoLogin(role, username);
      setIsAuthenticated(true);
      setUser(data.user);
      setIsAdmin(data.user.role === 'admin');
      showToast(`Logged in as ${data.user.username} (${data.user.role.toUpperCase()})`, 'success');
    } catch (err: any) {
      showToast('Login failed: ' + err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await apiLogout();
      setIsAuthenticated(false);
      setUser(null);
      setIsAdmin(false);
      showToast('Logged out successfully', 'info');
    } catch (err: any) {
      showToast('Logout error: ' + err.message, 'error');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        user,
        isAdmin,
        refreshUser,
        loginAsDemo,
        logout,
        toast,
        showToast
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
