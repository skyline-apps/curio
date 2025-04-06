import { supabase } from "@app/utils/supabase";
import { HeroUIProvider } from "@heroui/react"; // eslint-disable-line no-restricted-imports
import React, { PropsWithChildren, useEffect, useState } from "react";

import { AppLayoutProvider } from "./AppLayout/provider";
import { BrowserMessageProvider } from "./BrowserMessage/provider";
import { CacheProvider } from "./Cache/provider";
import { ClientProviders } from "./ClientProviders";
import { CurrentItemProvider } from "./CurrentItem/provider";
import { HighlightsProvider } from "./Highlights/provider";
import { ItemsProvider } from "./Items/provider";
import { SettingsProvider } from "./Settings/provider";
import { ToastProvider } from "./Toast/provider";
import { type User } from "./User";
import { UserProvider } from "./User/provider";

const AuthenticatedProviders: React.FC<PropsWithChildren> = ({
  children,
}: PropsWithChildren) => {
  return (
    <ItemsProvider>
      <CurrentItemProvider>
        <HighlightsProvider>
          <CacheProvider>
            <BrowserMessageProvider>{children}</BrowserMessageProvider>
          </CacheProvider>
        </HighlightsProvider>
      </CurrentItemProvider>
    </ItemsProvider>
  );
};

const Providers: React.FC<PropsWithChildren> = ({
  children,
}: PropsWithChildren) => {
  const [currentUser, setCurrentUser] = useState<User>({
    id: null,
    username: null,
    email: null,
    newsletterEmail: null,
  });

  useEffect(() => {
    const fetchProfile = async (): Promise<void> => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const profile = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (profile) {
          setCurrentUser({
            id: profile.userId,
            username: profile.username,
            email: user.email || null,
            newsletterEmail: profile.newsletterEmail,
          });
        }
      }
    };
    fetchProfile();
  }, []);

  return (
    <ClientProviders>
      <HeroUIProvider>
        <ToastProvider>
          <UserProvider user={currentUser}>
            <AppLayoutProvider>
              {currentUser && currentUser.id ? (
                <SettingsProvider>
                  <AuthenticatedProviders>{children}</AuthenticatedProviders>
                </SettingsProvider>
              ) : (
                <CurrentItemProvider>{children}</CurrentItemProvider>
              )}
            </AppLayoutProvider>
          </UserProvider>
        </ToastProvider>
      </HeroUIProvider>
    </ClientProviders>
  );
};

export default Providers;
