import { type UpdateEmailResponse } from "@app/schemas/v1/user/email";
import { type UpdateUsernameResponse } from "@app/schemas/v1/user/username";
import { authenticatedFetch, handleAPIResponse } from "@app/utils/api";
import { clearTheme, initializeTheme } from "@app/utils/displayStorage";
import { createLogger } from "@app/utils/logger";
import { supabase } from "@app/utils/supabase";
import posthog from "posthog-js";
import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { User, UserContext } from ".";

const log = createLogger("User");

interface UserProviderProps {
  children: React.ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({
  children,
}: UserProviderProps): React.ReactNode => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User>({
    id: null,
    username: null,
    email: null,
    newsletterEmail: null,
  });

  useEffect(() => {
    refreshUser();
  }, []);

  const clearUser = useCallback((): void => {
    setCurrentUser({
      id: null,
      username: null,
      email: null,
      newsletterEmail: null,
    });
  }, []);

  const refreshUser = useCallback(async (): Promise<void> => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const profile = await supabase
        .from("profiles")
        .select("username, newsletter_email")
        .eq("user_id", user.id)
        .single();

      setCurrentUser({
        id: user.id,
        email: user.email || null,
        username: profile.data?.username,
        newsletterEmail: profile.data?.newsletter_email,
      });
    } else {
      clearUser();
    }
  }, [clearUser]);

  const changeUsername = useCallback(
    async (username: string): Promise<void> => {
      return authenticatedFetch("/api/v1/user/username", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: currentUser.id, username: username }),
      })
        .then(handleAPIResponse<UpdateUsernameResponse>)
        .then((result) => {
          const { updatedUsername } = result;
          if (!updatedUsername) {
            throw Error("Failed to update username");
          }
          setCurrentUser({ ...currentUser, username: updatedUsername });
        });
    },
    [currentUser],
  );

  const updateNewsletterEmail = useCallback(async (): Promise<void> => {
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
  }, [currentUser]);

  const handleLogout = useCallback(async (): Promise<void> => {
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
  }, [clearUser, navigate]);

  return (
    <UserContext.Provider
      value={{
        user: currentUser,
        refreshUser,
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
