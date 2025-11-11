import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import * as userService from '../services/userService';
import { type UserData } from '../services/userService';

interface UserContextType {
  userData: UserData | null;
  loading: boolean;
  useCredit: () => void;
  purchasePlan: (planName: string, credits: number) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Determine the current user ID (either from auth or as a guest)
  useEffect(() => {
    if (currentUser) {
      setUserId(currentUser.uid);
    } else {
      const guestId = userService.getGuestId();
      setUserId(guestId);
    }
  }, [currentUser]);

  // Load user data whenever the userId changes
  useEffect(() => {
    if (userId) {
      setLoading(true);
      const data = userService.getUserData(userId);
      setUserData(data);
      setLoading(false);
    }
  }, [userId]);

  const useCredit = useCallback(() => {
    if (!userId || !userData) return;

    const newCredits = Math.max(0, userData.credits - 1);
    const newUserData = { ...userData, credits: newCredits };

    setUserData(newUserData);
    userService.updateUserData(userId, newUserData);
  }, [userId, userData]);

  const purchasePlan = useCallback((planName: string, credits: number) => {
    if (!userId || !userData) return;
    
    // In a real app, you might add to existing credits. Here we are setting them.
    const newUserData = { ...userData, credits: userData.credits + credits, plan: planName };
    
    setUserData(newUserData);
    userService.updateUserData(userId, newUserData);
  }, [userId, userData]);
  
  const value = {
    userData,
    loading,
    useCredit,
    purchasePlan,
  };

  return (
    <UserContext.Provider value={value}>
      {!loading && children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};