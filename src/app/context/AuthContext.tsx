import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';

// 1. We define the type (fixes the unused variable warning by applying it below)
export interface AuthContextType {
  user: any | null;
  isAuthenticated: boolean;
  login: (userData: any, token: string) => void;
  logout: () => void;
}

// Apply the AuthContextType to the createContext function
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any | null>(null);
  
  // 2. Define the missing state variable (fixes "Cannot find name 'setIsAuthenticated'")
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Check for existing login when the app loads
  useEffect(() => {
    const token = localStorage.getItem('inventory_token');
    const storedUser = localStorage.getItem('inventory_user');
    
    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
    }
  }, []);

  const login = (userData: any, token: string) => {
    setUser(userData);
    setIsAuthenticated(true); // This now works because we defined it above!
    
    // Save to localStorage
    localStorage.setItem('inventory_token', token);
    localStorage.setItem('inventory_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false); // This now works too!
    
    // Remove from localStorage
    localStorage.removeItem('inventory_token');
    localStorage.removeItem('inventory_user');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};