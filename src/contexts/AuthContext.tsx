import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Admin {
  id: string;
  username: string;
  full_name: string;
}

interface AuthContextType {
  admin: Admin | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedAdmin = localStorage.getItem('tibrewal_admin');
    if (storedAdmin) {
      try {
        setAdmin(JSON.parse(storedAdmin));
      } catch {
        localStorage.removeItem('tibrewal_admin');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    // Rate limiting check
    const attemptKey = `admin_login_attempts`;
    const lockoutKey = `admin_login_lockout`;
    
    const lockoutUntil = localStorage.getItem(lockoutKey);
    if (lockoutUntil && Date.now() < parseInt(lockoutUntil)) {
      return false;
    }

    const attempts = parseInt(localStorage.getItem(attemptKey) || '0');
    if (attempts >= MAX_ATTEMPTS) {
      localStorage.setItem(lockoutKey, (Date.now() + LOCKOUT_DURATION).toString());
      localStorage.removeItem(attemptKey);
      return false;
    }

    // Query admins table from database instead of hardcoded credentials
    const { data, error } = await supabase
      .from('admins')
      .select('id, username, full_name, password_hash')
      .eq('username', username)
      .single();

    if (error || !data || data.password_hash !== password) {
      localStorage.setItem(attemptKey, (attempts + 1).toString());
      return false;
    }

    // Success - clear attempts
    localStorage.removeItem(attemptKey);
    localStorage.removeItem(lockoutKey);

    const adminData: Admin = {
      id: data.id,
      username: data.username,
      full_name: data.full_name,
    };
    setAdmin(adminData);
    localStorage.setItem('tibrewal_admin', JSON.stringify(adminData));
    return true;
  };

  const logout = () => {
    setAdmin(null);
    localStorage.removeItem('tibrewal_admin');
  };

  return (
    <AuthContext.Provider
      value={{
        admin,
        isAuthenticated: !!admin,
        login,
        logout,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};