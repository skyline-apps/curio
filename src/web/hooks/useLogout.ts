import { useRouter } from "next/navigation";
import posthog from "posthog-js";
import { useContext } from "react";

import { UserContext } from "@web/providers/UserProvider";
import { clearTheme, initializeTheme } from "@web/utils/displayStorage";
import { createLogger } from "@web/utils/logger";
import { createClient } from "@web/utils/supabase/client";

const log = createLogger("useLogout");

export const useLogout = (): (() => Promise<void>) => {
  const router = useRouter();
  const { clearUser } = useContext(UserContext);

  const supabase = createClient();

  const handleLogout = async (): Promise<void> => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      log.error("Error with logout:", error);
      return;
    }
    // Clear the current user from the UserContext.
    clearUser();
    clearTheme();
    initializeTheme();
    posthog.reset();
    // Redirect to the landing page.
    router.push("/");
  };

  return handleLogout;
};
