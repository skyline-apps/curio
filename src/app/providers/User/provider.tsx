import { getSupabaseProjectRef } from "@app/utils/api";
import { clearTheme, initializeTheme } from "@app/utils/displayStorage";
import { createLogger } from "@app/utils/logger";
import { asyncStoragePersister, storage } from "@app/utils/storage";
import { getSupabaseClient } from "@app/utils/supabase";
import posthog from "posthog-js";
import React, { useCallback, useEffect, useState } from "react";

import { User, UserContext } from ".";

const log = createLogger("User");

interface UserProviderProps {
  children: React.ReactNode;
}

const projectRef = getSupabaseProjectRef();

export const UserProvider: React.FC<UserProviderProps> = ({
  children,
}: UserProviderProps): React.ReactNode => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<User>({
    id: null,
    email: null,
  });

  const clearUser = useCallback(async (): Promise<void> => {
    setCurrentUser({
      id: null,
      email: null,
    });

    await asyncStoragePersister.removeClient();
  }, []);

  const updateToken = useCallback(async (): Promise<void> => {
    const supabase = getSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user?.id && user?.email) {
      setCurrentUser((prevUser) => {
        if (
          prevUser.id !== user.id ||
          prevUser.email !== (user.email ?? null)
        ) {
          return { id: user.id, email: user.email ?? null };
        }
        return prevUser;
      });
    }
  }, []);

  const refreshUser = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      const token = await storage.getItem(`sb-${projectRef}-auth-token`);
      if (token) {
        const storedUser = JSON.parse(token).user;
        setCurrentUser({
          id: storedUser.id,
          email: storedUser.email,
        });
      }
    } catch (error) {
      log.error("Error refreshing user:", error);
    } finally {
      setIsLoading(false);
    }
    updateToken();
  }, [updateToken]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    const supabase = getSupabaseClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        if (session) {
          try {
            await fetch("/api/auth/session", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                accessToken: session.access_token,
                refreshToken: session.refresh_token,
              }),
            });
          } catch (error) {
            log.error("Error syncing session:", error);
          }
        }
      } else if (event === "SIGNED_OUT") {
        // Optional: Ensure strict logout sync if needed
        // But handleLogout usually covers this
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

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
