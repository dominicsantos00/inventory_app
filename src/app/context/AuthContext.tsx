import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthContextType } from '../types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users for demonstration
const mockUsers: Record<string, { password: string; user: User }> = {
  admin: {
    password: 'admin123',
    user: {
      id: '1',
      username: 'admin',
      fullName: 'System Administrator',
      role: 'level1',
      email: 'admin@denr.gov.ph',
    },
  },
  supplies: {
    password: 'supplies123',
    user: {
      id: '2',
      username: 'supplies',
      fullName: 'Office Supplies Manager',
      role: 'level2a',
      email: 'supplies@denr.gov.ph',
    },
  },
  equipment: {
    password: 'equipment123',
    user: {
      id: '3',
      username: 'equipment',
      fullName: 'Equipment Manager',
      role: 'level2b',
      email: 'equipment@denr.gov.ph',
    },
  },
  user: {
    password: 'user123',
    user: {
      id: '4',
      username: 'user',
      fullName: 'Division Staff',
      role: 'end-user',
      division: 'Administrative Division',
      email: 'user@denr.gov.ph',
    },
  },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check if user is already logged in
    const storedUser = localStorage.getItem('denr_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = (username: string, password: string): boolean => {
    const userEntry = mockUsers[username];
    if (userEntry && userEntry.password === password) {
      setUser(userEntry.user);
      localStorage.setItem('denr_user', JSON.stringify(userEntry.user));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('denr_user');
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
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
