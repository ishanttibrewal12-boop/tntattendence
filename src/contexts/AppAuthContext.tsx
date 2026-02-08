import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type AppRole = 'manager' | 'mlt_admin' | 'petroleum_admin' | 'crusher_admin';

export interface AppUser {
  id: string;
  username: string;
  full_name: string;
  role: AppRole;
  category: string | null;
}

interface AppAuthContextType {
  user: AppUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  hasAccess: (section: string) => boolean;
  canEdit: (section: string) => boolean;
}

const AppAuthContext = createContext<AppAuthContextType | undefined>(undefined);

export const useAppAuth = () => {
  const context = useContext(AppAuthContext);
  if (context === undefined) {
    throw new Error('useAppAuth must be used within an AppAuthProvider');
  }
  return context;
};

// Define section access for each role
const ROLE_ACCESS: Record<AppRole, { sections: string[]; editSections: string[] }> = {
  manager: {
    sections: ['*'], // All access
    editSections: ['*'], // Can edit everything
  },
  mlt_admin: {
    sections: ['mlt', 'mlt-attendance', 'mlt-advances', 'mlt-staff', 'mlt-profiles'],
    editSections: ['mlt', 'mlt-attendance', 'mlt-advances', 'mlt-staff', 'mlt-profiles'],
  },
  petroleum_admin: {
    sections: ['petroleum', 'petroleum-attendance', 'petroleum-advances', 'petroleum-staff', 'petroleum-profiles'],
    editSections: ['petroleum', 'petroleum-attendance', 'petroleum-advances', 'petroleum-staff', 'petroleum-profiles'],
  },
  crusher_admin: {
    sections: ['crusher', 'crusher-attendance', 'crusher-advances', 'crusher-staff', 'crusher-profiles'],
    editSections: ['crusher', 'crusher-attendance', 'crusher-advances', 'crusher-staff', 'crusher-profiles'],
  },
};

interface AppAuthProviderProps {
  children: ReactNode;
}

export const AppAuthProvider: React.FC<AppAuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const storedUser = localStorage.getItem('tibrewal_app_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('tibrewal_app_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .eq('username', username)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        return { success: false, error: 'Invalid username or password' };
      }

      // Verify password (stored as plain text for simplicity - in production use hashing)
      if (data.password_hash !== password) {
        return { success: false, error: 'Invalid username or password' };
      }

      const appUser: AppUser = {
        id: data.id,
        username: data.username,
        full_name: data.full_name,
        role: data.role as AppRole,
        category: data.category,
      };

      setUser(appUser);
      localStorage.setItem('tibrewal_app_user', JSON.stringify(appUser));
      return { success: true };
    } catch (err) {
      console.error('Login error:', err);
      return { success: false, error: 'An error occurred during login' };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('tibrewal_app_user');
  };

  const hasAccess = (section: string): boolean => {
    if (!user) return false;
    const access = ROLE_ACCESS[user.role];
    if (access.sections.includes('*')) return true;
    return access.sections.some(s => section.startsWith(s) || s === section);
  };

  const canEdit = (section: string): boolean => {
    if (!user) return false;
    const access = ROLE_ACCESS[user.role];
    if (access.editSections.includes('*')) return true;
    return access.editSections.some(s => section.startsWith(s) || s === section);
  };

  return (
    <AppAuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        hasAccess,
        canEdit,
      }}
    >
      {children}
    </AppAuthContext.Provider>
  );
};
