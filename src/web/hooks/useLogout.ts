import { useRouter } from "next/navigation";
import { useContext } from "react";

import { UserContext } from "@/providers/UserProvider";
import { createLogger } from "@/utils/logger";
import { createClient } from "@/utils/supabase/client";
import { clearTheme, initializeTheme } from "@/utils/themeStorage";

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
    // Redirect to the landing page.
    router.push("/");
  };

  return handleLogout;
};
