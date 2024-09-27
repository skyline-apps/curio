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
  changeUsername: (username: string) => void;
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
  changeUsername: (_username: string) => {},
});

export const UserProvider: React.FC<UserProviderProps> = ({
  children,
  user,
}: UserProviderProps): React.ReactNode => {
  const [currentUser, setCurrentUser] = useState<User>(user);

  const clearUser = (): void => {
    setCurrentUser({ id: null, username: null, email: null });
  };

  const changeUsername = (username: string): void => {
    setCurrentUser({ ...currentUser, username });
  };

  return (
    <UserContext.Provider
      value={{ user: currentUser, clearUser, changeUsername }}
    >
      {children}
    </UserContext.Provider>
  );
};
