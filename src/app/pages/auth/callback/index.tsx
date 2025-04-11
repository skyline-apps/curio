import Spinner from "@app/components/ui/Spinner";
import { useUser } from "@app/providers/User";
import { createLogger } from "@app/utils/logger";
import { getSupabaseClient } from "@app/utils/supabase";
import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const log = createLogger("auth");

const AuthCallback: React.FC = () => {
  const { refreshUser } = useUser();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const supabase = getSupabaseClient();
    const nextUrl = searchParams.get("next") || "/home";

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" || event === "INITIAL_SESSION") {
          if (authListener) {
            authListener.subscription.unsubscribe();
          }
          if (!session) {
            throw new Error("No session found");
          }
          try {
            const response = await fetch("/api/auth/session", {
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
              throw new Error(
                `Failed to set session cookie: ${await response.text()}`,
              );
            }

            refreshUser();
            navigate(nextUrl, { replace: true });
          } catch (error) {
            log.error(
              "Error setting session cookie:",
              error instanceof Error ? error.message : error,
            );
            await supabase.auth.signOut();
            navigate("/login?error=session_error");
          }
        }
      },
    );

    const timer = setTimeout(() => {
      log.warn("Timeout waiting for session, attempting redirect anyway.");
      if (authListener) {
        authListener.subscription.unsubscribe();
      }
      refreshUser();
      navigate(nextUrl, { replace: true });
    }, 5000);

    return () => {
      clearTimeout(timer);
      if (authListener) {
        authListener.subscription.unsubscribe();
      }
    };
  }, [navigate, searchParams, refreshUser]);

  return (
    <div className="flex flex-col items-center gap-4 w-full h-dvh">
      <Spinner centered />
    </div>
  );
};

export default AuthCallback;
