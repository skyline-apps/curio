import { handleAPIResponse } from "@app/utils/api";
import { type UpdateEmailResponse } from "@web/app/api/v1/user/email/validation";
import { type UpdateUsernameResponse } from "@web/app/api/v1/user/username/validation";
import React, { useState } from "react";

import { User, UserContext } from ".";

interface UserProviderProps {
  children: React.ReactNode;
  user: User;
}

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
