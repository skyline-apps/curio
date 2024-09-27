import React, { PropsWithChildren } from "react";
import { NextUIProvider } from "@nextui-org/react";

import { type User, UserProvider } from "./UserProvider";

import { db, eq } from "@/db";
import { createClient } from "@/utils/supabase/server";
import { createLogger } from "@/utils/logger";
import { profiles } from "@/db/schema";

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
      <UserProvider user={currentUser}>{children}</UserProvider>
    </NextUIProvider>
  );
};

export default Providers;
