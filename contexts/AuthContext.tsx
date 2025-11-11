
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as authService from '../services/authService';
import { type User } from '../services/authService';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  loginWithEmail: (email: string, password: string) => Promise<User>;
  signupWithEmail: (email: string, password: string) => Promise<User>;
  loginWithGoogle: () => Promise<User>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // This effect runs on initial mount to check for an existing session.
  // It also sets up a listener for auth changes (e.g., login in another tab).
  useEffect(() => {
    const checkUser = () => {
        const user = authService.getCurrentUser();
        setCurrentUser(user);
        setLoading(false);
    };
    
    checkUser(); // Initial check

    window.addEventListener('auth-change', checkUser);
    return () => {
      window.removeEventListener('auth-change', checkUser);
    };
  }, []);

  const loginWithEmail = useCallback(async (email: string, password: string) => {
    const user = await authService.loginWithEmail(email, password);
    setCurrentUser(user);
    return user;
  }, []);

  const signupWithEmail = useCallback(async (email: string, password: string) => {
    const user = await authService.signupWithEmail(email, password);
    setCurrentUser(user);
    return user;
  }, []);
  
  const loginWithGoogle = useCallback(async () => {
    const user = await authService.loginWithGoogle();
    setCurrentUser(user);
    return user;
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setCurrentUser(null);
  }, []);

  const value = {
    currentUser,
    loading,
    loginWithEmail,
    signupWithEmail,
    loginWithGoogle,
    logout,
  };

  // Don't render children until we've checked for a user, to avoid flashes of content.
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};