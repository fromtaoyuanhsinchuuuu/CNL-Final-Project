import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';

// Mock user data for demonstration purposes
const MOCK_USER: User = {
  id: '1',
  name: 'Player',
  email: 'user@example.com',
  isOnline: true,
  score: 0
};

type UserContextType = {
  currentUser: User;
  updateUser: (updates: Partial<User>) => void;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User>(MOCK_USER);

  const updateUser = (updates: Partial<User>) => {
    setCurrentUser(prev => ({ ...prev, ...updates }));
  };

  // In a real application, you would fetch user data from an API or local storage here
  useEffect(() => {
    // Simulating user data loading
    const timer = setTimeout(() => {
      setCurrentUser(MOCK_USER);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <UserContext.Provider value={{ currentUser, updateUser }}>
      {children}
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