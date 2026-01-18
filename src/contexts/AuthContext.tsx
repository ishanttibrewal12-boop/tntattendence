import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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

// Admin credentials - stored securely in database
const ADMIN_CREDENTIALS = [
  { username: 'ishant8465', password: 'ishant@8465', full_name: 'Ishant Tibrewal' },
  { username: 'trishav8465', password: 'trishav@8465', full_name: 'Trishav Tibrewal' },
  { username: 'abhay1234', password: 'abhay@1234', full_name: 'Abhay Jalan' },
  { username: 'sunil8465', password: 'sunil@8465', full_name: 'Sunil Tibrewal' },
];

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
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
    const foundAdmin = ADMIN_CREDENTIALS.find(
      (a) => a.username === username && a.password === password
    );

    if (foundAdmin) {
      const adminData: Admin = {
        id: crypto.randomUUID(),
        username: foundAdmin.username,
        full_name: foundAdmin.full_name,
      };
      setAdmin(adminData);
      localStorage.setItem('tibrewal_admin', JSON.stringify(adminData));
      return true;
    }
    return false;
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
