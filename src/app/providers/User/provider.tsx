import { type UpdateEmailResponse } from "@app/schemas/v1/user/email";
import { type UpdateUsernameResponse } from "@app/schemas/v1/user/username";
import { authenticatedFetch, handleAPIResponse } from "@app/utils/api";
import { clearTheme, initializeTheme } from "@app/utils/displayStorage";
import { createLogger } from "@app/utils/logger";
import { getSupabaseClient } from "@app/utils/supabase";
import posthog from "posthog-js";
import React, { useCallback, useEffect, useState } from "react";

import { User, UserContext } from ".";

const log = createLogger("User");

interface UserProviderProps {
  children: React.ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({
  children,
}: UserProviderProps): React.ReactNode => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<User>({
    id: null,
    username: null,
    email: null,
    newsletterEmail: null,
  });

  const clearUser = useCallback((): void => {
    setCurrentUser({
      id: null,
      username: null,
      email: null,
      newsletterEmail: null,
    });
  }, []);

  const refreshUser = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      const supabase = getSupabaseClient();
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
    } catch (error) {
      log.error("Error refreshing user:", error);
    } finally {
      setIsLoading(false);
    }
  }, [clearUser]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

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
    try {
      const backendResponse = await fetch("/api/auth/logout", {
        method: "POST",
      });
      if (!backendResponse.ok) {
        log.error("Backend logout failed:", await backendResponse.text());
      }
    } catch (error) {
      log.error("Error during logout process:", error);
    } finally {
      clearUser();
      clearTheme();
      initializeTheme();
      posthog.reset();
    }
  }, [clearUser]);

  return (
    <UserContext.Provider
      value={{
        user: currentUser,
        isLoading,
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
