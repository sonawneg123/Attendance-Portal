import React, { createContext, useContext, useEffect, useState } from 'react';
import type { AuthUser, UserRole, ActivationPayload } from '../types/auth';
import { authService } from '../services/authService';
import { supabase } from '../services/supabase';

interface AuthContextType {
  user: AuthUser | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<AuthUser>;
  activate: (payload: ActivationPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshProfile = async () => {
    try {
      const profile = await authService.getProfile();
      setUser(profile);
    } catch (err) {
      console.error('Error refreshing profile:', err);
      setUser(null);
    }
  };

  useEffect(() => {
    // Check initial auth state
    refreshProfile().finally(() => {
      setIsLoading(false);
    });

    // Listen to Supabase auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        await refreshProfile();
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const login = async (username: string, password: string): Promise<AuthUser> => {
    setIsLoading(true);
    try {
      const res = await authService.login(username, password);
      setUser(res.user);
      return res.user;
    } finally {
      setIsLoading(false);
    }
  };

  const activate = async (payload: ActivationPayload): Promise<void> => {
    setIsLoading(true);
    try {
      await authService.activateAccount(payload);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await authService.logout();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        isAuthenticated: !!user,
        isLoading,
        login,
        activate,
        logout,
        refreshProfile,
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
