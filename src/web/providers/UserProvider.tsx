"use client";
import React, { createContext, useState } from "react";

export type User = {
  id: string | null;
  username: string | null;
  email: string | null;
};

export type UserContextType = {
  user: User;
  clearUser: () => void;
};

interface UserProviderProps {
  children: React.ReactNode;
  user: User;
}

export const UserContext = createContext<UserContextType>({
  user: {
    id: null,
    username: null,
    email: null,
  },
  clearUser: () => {},
});

export const UserProvider: React.FC<UserProviderProps> = ({
  children,
  user,
}: UserProviderProps): React.ReactNode => {
  const [currentUser, setCurrentUser] = useState<User>(user);

  const clearUser = (): void => {
    setCurrentUser({ id: null, username: null, email: null });
  };

  return (
    <UserContext.Provider value={{ user: currentUser, clearUser }}>
      {children}
    </UserContext.Provider>
  );
};
