import Spinner from "@app/components/ui/Spinner";
import { useUser } from "@app/providers/User";
import { createLogger } from "@app/utils/logger";
import { getSupabaseClient, type Session } from "@app/utils/supabase";
import React, { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const log = createLogger("auth");

const AuthCallback: React.FC = () => {
  const { refreshUser } = useUser();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const processing = useRef(false);

  const host = import.meta.env.VITE_CURIO_URL;

  useEffect(() => {
    if (processing.current) {
      return;
    }
    processing.current = true;

    const supabase = getSupabaseClient();
    const nextUrl = searchParams.get("next") || "/home";
    const authCode = searchParams.get("code");

    (async () => {
      try {
        // 1) Try to use any existing session
        let session: Session | null = (await supabase.auth.getSession()).data
          .session;

        // 2) If no session and we have a code, exchange it
        if (!session && authCode) {
          const { data, error } =
            await supabase.auth.exchangeCodeForSession(authCode);
          if (error) {
            throw new Error(`Code exchange failed: ${error.message}`);
          }
          if (!data.session) {
            throw new Error(
              "Code exchange successful, but no session returned.",
            );
          }
          session = data.session;
        }

        // 3) If we still have no session, bail out with a clear error
        if (!session) {
          log.error("No code parameter found and no existing session.");
          navigate("/login?error=no_code");
          return;
        }

        // 4) Inform backend of the session
        const response = await fetch(`${host}/api/auth/session`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            accessToken: session.access_token,
            refreshToken: session.refresh_token,
          }),
        });
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Error logging in on backend: ${errorText}`);
        }

        // 5) Refresh and navigate
        refreshUser();
        navigate(nextUrl);
      } catch (e) {
        if (e instanceof Error) {
          log.error("Auth callback error:", { error: e.message });
        }
        await supabase.auth
          .signOut()
          .catch((err) => log.error("Sign out failed:", err));
        navigate(
          `/login?error=${e instanceof Error ? encodeURIComponent(e.message) : "session_error"}`,
        );
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col items-center gap-4 w-full h-dvh">
      <Spinner centered />
    </div>
  );
};

export default AuthCallback;
