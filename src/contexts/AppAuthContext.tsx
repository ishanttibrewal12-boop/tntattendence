import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
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

const SESSION_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes
const SESSION_KEY = 'tibrewal_app_user';
const SESSION_TS_KEY = 'tibrewal_session_ts';

export const useAppAuth = () => {
  const context = useContext(AppAuthContext);
  if (context === undefined) {
    throw new Error('useAppAuth must be used within an AppAuthProvider');
  }
  return context;
};

const ROLE_ACCESS: Record<AppRole, { sections: string[]; editSections: string[] }> = {
  manager: {
    sections: ['*'],
    editSections: ['*'],
  },
  mlt_admin: {
    sections: ['mlt', 'mlt-attendance', 'mlt-advances', 'mlt-staff', 'mlt-profiles', 'mlt-services', 'mlt-fuel-report'],
    editSections: ['mlt', 'mlt-attendance', 'mlt-advances', 'mlt-staff', 'mlt-profiles', 'mlt-services', 'mlt-fuel-report'],
  },
  petroleum_admin: {
    sections: ['petroleum', 'petroleum-attendance', 'petroleum-advances', 'petroleum-staff', 'petroleum-profiles', 'mlt-fuel-report'],
    editSections: ['petroleum', 'petroleum-attendance', 'petroleum-advances', 'petroleum-staff', 'petroleum-profiles', 'mlt-fuel-report'],
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
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearSession = useCallback(() => {
    setUser(null);
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_TS_KEY);
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
  }, []);

  const resetInactivityTimer = useCallback(() => {
    if (!user) return;
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    sessionStorage.setItem(SESSION_TS_KEY, Date.now().toString());
    inactivityTimerRef.current = setTimeout(() => {
      clearSession();
    }, SESSION_TIMEOUT_MS);
  }, [user, clearSession]);

  // Set up activity listeners
  useEffect(() => {
    if (!user) return;

    const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    const handler = () => resetInactivityTimer();
    events.forEach(e => window.addEventListener(e, handler, { passive: true }));
    resetInactivityTimer();

    return () => {
      events.forEach(e => window.removeEventListener(e, handler));
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    };
  }, [user, resetInactivityTimer]);

  // Check for existing session on mount
  useEffect(() => {
    const storedUser = sessionStorage.getItem(SESSION_KEY);
    const sessionTs = sessionStorage.getItem(SESSION_TS_KEY);
    if (storedUser && sessionTs) {
      const elapsed = Date.now() - parseInt(sessionTs, 10);
      if (elapsed < SESSION_TIMEOUT_MS) {
        try {
          setUser(JSON.parse(storedUser));
        } catch {
          clearSession();
        }
      } else {
        clearSession();
      }
    } else if (storedUser) {
      // Legacy session without timestamp — clear
      clearSession();
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
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(appUser));
      sessionStorage.setItem(SESSION_TS_KEY, Date.now().toString());
      return { success: true };
    } catch (err) {
      console.error('Login error:', err);
      return { success: false, error: 'An error occurred during login' };
    }
  };

  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

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
