import { getSupabaseProjectRef } from "@app/utils/api";
import { clearTheme, initializeTheme } from "@app/utils/displayStorage";
import { createLogger } from "@app/utils/logger";
import { storage } from "@app/utils/storage";
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
    email: null,
  });

  const clearUser = useCallback((): void => {
    setCurrentUser({
      id: null,
      email: null,
    });
  }, []);

  const refreshUser = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      const supabase = getSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user?.id && user?.email) {
        setCurrentUser({
          id: user.id,
          email: user.email,
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

      try {
        const projectRef = getSupabaseProjectRef();
        if (projectRef) {
          const key = `sb-${projectRef}-auth-token`;
          storage.removeItem(key);
        }
      } catch (e) {
        log.error("Failed to remove Supabase auth token from storage", e);
      }
    }
  }, [clearUser]);

  return (
    <UserContext.Provider
      value={{
        user: currentUser,
        isLoading,
        refreshUser,
        clearUser,
        handleLogout,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
