// --- MOCK AUTHENTICATION SERVICE ---
// This is a mock service to simulate a full authentication flow without a backend.
// It uses localStorage to persist a "session" and does not store any data remotely.
import * as userService from './userService';

export interface User {
  uid: string;
  email: string;
  displayName?: string;
}

const MOCK_USER_KEY = 'sareestage_mock_user';

// Simulates an API call delay
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

const validateEmail = (email: string) => {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
};

export const loginWithEmail = async (email: string, password: string): Promise<User> => {
  await delay(1000);
  if (!validateEmail(email) || password.length < 6) {
    throw new Error('Invalid email or password. Password must be at least 6 characters.');
  }
  // In a real app, you would verify credentials against a server.
  // Here, we just create a mock user session.
  const user: User = { uid: `mock-uid-${Date.now()}`, email };
  localStorage.setItem(MOCK_USER_KEY, JSON.stringify(user));
  window.dispatchEvent(new Event('auth-change')); // Notify listeners
  return user;
};

export const signupWithEmail = async (email: string, password: string): Promise<User> => {
  await delay(1200);
  if (!validateEmail(email) || password.length < 6) {
    throw new Error('Invalid email or password. Password must be at least 6 characters.');
  }
  // In a real app, you would check if the user exists before creating a new one.
  const user: User = { uid: `mock-uid-${Date.now()}`, email };
  
  // Initialize user data (e.g., credits) for the new user.
  userService.initializeUser(user.uid);
  
  localStorage.setItem(MOCK_USER_KEY, JSON.stringify(user));
  window.dispatchEvent(new Event('auth-change')); // Notify listeners
  return user;
};

export const loginWithGoogle = async (): Promise<User> => {
  await delay(800);
  // This simulates a successful Google OAuth popup flow.
  const user: User = { uid: `mock-google-uid-${Date.now()}`, email: 'user@google.com', displayName: 'Google User' };
  
  // Initialize user data if they don't exist yet
  const existingData = userService.getUserData(user.uid);
  if (!existingData) {
      userService.initializeUser(user.uid);
  }

  localStorage.setItem(MOCK_USER_KEY, JSON.stringify(user));
  window.dispatchEvent(new Event('auth-change')); // Notify listeners
  return user;
};

export const logout = async (): Promise<void> => {
    await delay(500);
    localStorage.removeItem(MOCK_USER_KEY);
    window.dispatchEvent(new Event('auth-change')); // Notify listeners
};

export const getCurrentUser = (): User | null => {
    const userJson = localStorage.getItem(MOCK_USER_KEY);
    if (!userJson) return null;
    try {
        return JSON.parse(userJson) as User;
    } catch (e) {
        return null;
    }
};