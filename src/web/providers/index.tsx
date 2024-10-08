// eslint-disable-next-line no-restricted-imports
import { NextUIProvider } from "@nextui-org/react";
import React, { PropsWithChildren } from "react";

import { db, eq } from "@/db";
import { profiles } from "@/db/schema";
import { createLogger } from "@/utils/logger";
import { createClient } from "@/utils/supabase/server";

import { SettingsProvider } from "./SettingsProvider";
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
    <NextUIProvider>
      <UserProvider user={currentUser}>
        <SettingsProvider>{children}</SettingsProvider>
      </UserProvider>
    </NextUIProvider>
  );
};

export default Providers;
