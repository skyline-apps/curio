// eslint-disable-next-line no-restricted-imports
import { HeroUIProvider } from "@heroui/react";
import React, { PropsWithChildren } from "react";

import { db, eq } from "@/db";
import { profiles } from "@/db/schema";
import { createLogger } from "@/utils/logger";
import { createClient } from "@/utils/supabase/server";

import { BrowserMessageProvider } from "./BrowserMessageProvider";
import { ClientProviders } from "./ClientProviders";
import { CurrentItemProvider } from "./CurrentItemProvider";
import { ItemsProvider } from "./ItemsProvider";
import { SettingsProvider } from "./SettingsProvider";
import { ToastProvider } from "./ToastProvider";
import { type User, UserProvider } from "./UserProvider";

const log = createLogger("Providers");

const Providers: React.FC<PropsWithChildren> = async ({
  children,
}: PropsWithChildren) => {
  let currentUser: User = { id: null, username: null, email: null };

  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    log.error("Error getting user:", error);
  }

  if (user) {
    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.userId, user.id),
    });

    if (profile) {
      currentUser = {
        id: profile.userId,
        username: profile.username,
        email: user.email || null,
      };
    }
  }

  return (
    <ClientProviders>
      <HeroUIProvider>
        <UserProvider user={currentUser}>
          <ItemsProvider>
            <ToastProvider>
              <BrowserMessageProvider>
                <CurrentItemProvider>
                  <SettingsProvider>{children}</SettingsProvider>
                </CurrentItemProvider>
              </BrowserMessageProvider>
            </ToastProvider>
          </ItemsProvider>
        </UserProvider>
      </HeroUIProvider>
    </ClientProviders>
  );
};

export default Providers;
