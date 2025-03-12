"use client";
import posthog from "posthog-js";
import React, { createContext, useEffect, useState } from "react";

import { type UpdateUsernameResponse } from "@/app/api/v1/user/username/validation";
import { handleAPIResponse } from "@/utils/api";

export type User = {
  id: string | null;
  username: string | null;
  email: string | null;
};

export type UserContextType = {
  user: User;
  clearUser: () => void;
  changeUsername: (username: string) => Promise<void>;
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
  changeUsername: (_username: string) => Promise.resolve(),
});

export const UserProvider: React.FC<UserProviderProps> = ({
  children,
  user,
}: UserProviderProps): React.ReactNode => {
  const [currentUser, setCurrentUser] = useState<User>(user);

  useEffect(() => {
    if (currentUser.id) {
      posthog.identify(currentUser.id, {
        username: currentUser.username,
        email: currentUser.email,
      });
    }
  }, [currentUser.id, currentUser.username, currentUser.email]);

  const clearUser = (): void => {
    setCurrentUser({ id: null, username: null, email: null });
  };

  const changeUsername = async (username: string): Promise<void> => {
    return fetch("/api/v1/user/username", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId: user.id, username: username }),
    })
      .then(handleAPIResponse<UpdateUsernameResponse>)
      .then((result) => {
        const { updatedUsername } = result;
        if (!updatedUsername) {
          throw Error("Failed to update username");
        }
        setCurrentUser({ ...currentUser, username: updatedUsername });
      });
  };

  return (
    <UserContext.Provider
      value={{ user: currentUser, clearUser, changeUsername }}
    >
      {children}
    </UserContext.Provider>
  );
};
