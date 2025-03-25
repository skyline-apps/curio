"use client";
import { type UpdateEmailResponse } from "@web/app/api/v1/user/email/validation";
import { type UpdateUsernameResponse } from "@web/app/api/v1/user/username/validation";
import { handleAPIResponse } from "@web/utils/api";
import React, { createContext, useState } from "react";

export type User = {
  id: string | null;
  username: string | null;
  email: string | null;
  newsletterEmail: string | null;
};

export type UserContextType = {
  user: User;
  clearUser: () => void;
  changeUsername: (username: string) => Promise<void>;
  updateNewsletterEmail: () => Promise<void>;
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
    newsletterEmail: null,
  },
  clearUser: () => {},
  changeUsername: (_username: string) => Promise.resolve(),
  updateNewsletterEmail: () => Promise.resolve(),
});

export const UserProvider: React.FC<UserProviderProps> = ({
  children,
  user,
}: UserProviderProps): React.ReactNode => {
  const [currentUser, setCurrentUser] = useState<User>(user);

  const clearUser = (): void => {
    setCurrentUser({
      id: null,
      username: null,
      email: null,
      newsletterEmail: null,
    });
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

  const updateNewsletterEmail = async (): Promise<void> => {
    return fetch("/api/v1/user/email", {
      method: "POST",
    })
      .then(handleAPIResponse<UpdateEmailResponse>)
      .then((result) => {
        const { updatedNewsletterEmail } = result;
        if (!updatedNewsletterEmail) {
          throw Error("Failed to update newsletter email");
        }
        setCurrentUser({
          ...currentUser,
          newsletterEmail: updatedNewsletterEmail,
        });
      });
  };

  return (
    <UserContext.Provider
      value={{
        user: currentUser,
        clearUser,
        changeUsername,
        updateNewsletterEmail,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
