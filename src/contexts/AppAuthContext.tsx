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
  requestLogout: () => void;
  confirmLogout: () => void;
  cancelLogout: () => void;
  hasAccess: (section: string) => boolean;
  canEdit: (section: string) => boolean;
  logoutWarning: boolean;
  logoutConfirm: boolean;
  dismissWarning: () => void;
}

const AppAuthContext = createContext<AppAuthContextType | undefined>(undefined);

const IDLE_WARNING_MS = 5 * 60 * 1000; // Show warning after 5 minutes of inactivity
const AUTO_LOGOUT_MS = IDLE_WARNING_MS + 60 * 1000; // Auto logout 60s after warning
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
  const [logoutWarning, setLogoutWarning] = useState(false);
  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const playLogoutSound = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    } catch {}
  }, []);

  const clearSession = useCallback(() => {
    playLogoutSound();
    setUser(null);
    setLogoutWarning(false);
    setLogoutConfirm(false);
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_TS_KEY);
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
      warningTimerRef.current = null;
    }
  }, [playLogoutSound]);

  const resetInactivityTimer = useCallback(() => {
    if (!user) return;
    setLogoutWarning(false);

    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);

    sessionStorage.setItem(SESSION_TS_KEY, Date.now().toString());

    warningTimerRef.current = setTimeout(() => {
      setLogoutWarning(true);
    }, IDLE_WARNING_MS);

    // Actual logout
    inactivityTimerRef.current = setTimeout(() => {
      clearSession();
    }, AUTO_LOGOUT_MS);
  }, [user, clearSession]);

  const dismissWarning = useCallback(() => {
    setLogoutWarning(false);
    resetInactivityTimer();
  }, [resetInactivityTimer]);

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
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    };
  }, [user, resetInactivityTimer]);

  // Check for existing session on mount
  useEffect(() => {
    const storedUser = sessionStorage.getItem(SESSION_KEY);
    const sessionTs = sessionStorage.getItem(SESSION_TS_KEY);
    if (storedUser && sessionTs) {
      const elapsed = Date.now() - parseInt(sessionTs, 10);
      if (elapsed < AUTO_LOGOUT_MS) {
        try {
          setUser(JSON.parse(storedUser));
        } catch {
          clearSession();
        }
      } else {
        clearSession();
      }
    } else if (storedUser) {
      clearSession();
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Rate limiting check
      const attemptKey = `login_attempts_${username}`;
      const lockoutKey = `login_lockout_${username}`;
      const MAX_ATTEMPTS = 5;
      const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

      const lockoutUntil = sessionStorage.getItem(lockoutKey);
      if (lockoutUntil && Date.now() < parseInt(lockoutUntil)) {
        const remaining = Math.ceil((parseInt(lockoutUntil) - Date.now()) / 60000);
        return { success: false, error: `Account locked. Try again in ${remaining} minutes.` };
      }

      const attempts = parseInt(sessionStorage.getItem(attemptKey) || '0');
      if (attempts >= MAX_ATTEMPTS) {
        sessionStorage.setItem(lockoutKey, (Date.now() + LOCKOUT_DURATION).toString());
        sessionStorage.removeItem(attemptKey);
        return { success: false, error: 'Too many failed attempts. Account locked for 15 minutes.' };
      }

      const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .eq('username', username)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        sessionStorage.setItem(attemptKey, (attempts + 1).toString());
        return { success: false, error: `Invalid username or password. ${MAX_ATTEMPTS - attempts - 1} attempts remaining.` };
      }

      if (data.password_hash !== password) {
        sessionStorage.setItem(attemptKey, (attempts + 1).toString());
        return { success: false, error: `Invalid username or password. ${MAX_ATTEMPTS - attempts - 1} attempts remaining.` };
      }

      // Success - clear attempts
      sessionStorage.removeItem(attemptKey);
      sessionStorage.removeItem(lockoutKey);

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

  const requestLogout = useCallback(() => {
    playLogoutSound();
    setLogoutConfirm(true);
  }, [playLogoutSound]);

  const confirmLogout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  const cancelLogout = useCallback(() => {
    setLogoutConfirm(false);
  }, []);

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
        requestLogout,
        confirmLogout,
        cancelLogout,
        hasAccess,
        canEdit,
        logoutWarning,
        logoutConfirm,
        dismissWarning,
      }}
    >
      {children}
    </AppAuthContext.Provider>
  );
};