import { type UpdateEmailResponse } from "@app/schemas/v1/user/email";
import { type UpdateUsernameResponse } from "@app/schemas/v1/user/username";
import { authenticatedFetch, handleAPIResponse } from "@app/utils/api";
import { clearTheme, initializeTheme } from "@app/utils/displayStorage";
import { createLogger } from "@app/utils/logger";
import { supabase } from "@app/utils/supabase";
import posthog from "posthog-js";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import { User, UserContext } from ".";

const log = createLogger("User");

interface UserProviderProps {
  children: React.ReactNode;
  user: User;
}

export const UserProvider: React.FC<UserProviderProps> = ({
  children,
  user,
}: UserProviderProps): React.ReactNode => {
  const navigate = useNavigate();
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
    return authenticatedFetch("/api/v1/user/username", {
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
    return authenticatedFetch("/api/v1/user/email", {
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

  const handleLogout = async (): Promise<void> => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      log.error("Error with logout:", error);
      return;
    }
    clearUser();
    clearTheme();
    initializeTheme();
    posthog.reset();
    navigate("/");
  };

  return (
    <UserContext.Provider
      value={{
        user: currentUser,
        clearUser,
        changeUsername,
        updateNewsletterEmail,
        handleLogout,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
