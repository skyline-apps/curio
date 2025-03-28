// eslint-disable-next-line no-restricted-imports
import { HeroUIProvider } from "@heroui/react";
import { db, eq } from "@web/db";
import { profiles } from "@web/db/schema";
import { createClient } from "@web/utils/supabase/server";
import React, { PropsWithChildren } from "react";

import { AppLayoutProvider } from "./AppLayoutProvider";
import { BrowserMessageProvider } from "./BrowserMessageProvider";
import { CacheProvider } from "./CacheProvider";
import { ClientProviders } from "./ClientProviders";
import { CurrentItemProvider } from "./CurrentItemProvider";
import { HighlightsProvider } from "./HighlightsProvider";
import { ItemsProvider } from "./ItemsProvider";
import { SettingsProvider } from "./SettingsProvider";
import { ToastProvider } from "./ToastProvider";
import { type User, UserProvider } from "./UserProvider";

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

const Providers: React.FC<PropsWithChildren> = async ({
  children,
}: PropsWithChildren) => {
  let currentUser: User = {
    id: null,
    username: null,
    email: null,
    newsletterEmail: null,
  };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.userId, user.id),
    });

    if (profile) {
      currentUser = {
        id: profile.userId,
        username: profile.username,
        email: user.email || null,
        newsletterEmail: profile.newsletterEmail,
      };
    }
  }

  return (
    <ClientProviders>
      <HeroUIProvider>
        <ToastProvider>
          <UserProvider user={currentUser}>
            <AppLayoutProvider>
              {user ? (
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
