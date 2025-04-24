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

    const exchangeCode = async (code: string): Promise<void> => {
      try {
        let session: Session | null = null;
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          session = data.session;
        } else {
          const { data, error } =
            await supabase.auth.exchangeCodeForSession(code);

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

        const response = await fetch(`${host}/api/auth/session`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            accessToken: session.access_token,
            refreshToken: session.refresh_token,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Error logging in on backend: ${errorText}`);
        }

        refreshUser();
        navigate(nextUrl);
      } catch (e) {
        if (e instanceof Error) {
          log.error("Error during manual code exchange or backend call:", {
            error: e.message,
          });
        }
        await supabase.auth
          .signOut()
          .catch((err) => log.error("Sign out failed:", err));
        navigate(
          `/login?error=${e instanceof Error ? encodeURIComponent(e.message) : "session_error"}`,
        );
      }
    };

    if (authCode) {
      exchangeCode(authCode);
    } else {
      log.error("No code parameter found.");
      navigate("/login?error=no_code");
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col items-center gap-4 w-full h-dvh">
      <Spinner centered />
    </div>
  );
};

export default AuthCallback;
