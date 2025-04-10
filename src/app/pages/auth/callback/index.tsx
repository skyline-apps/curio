import { useUser } from "@app/providers/User";
import { createLogger } from "@app/utils/logger";
import { supabase } from "@app/utils/supabase";
import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const log = createLogger("auth");

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshUser } = useUser();

  useEffect(() => {
    const nextUrl = searchParams.get("next") || "/home";

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, _session) => {
        if (event === "SIGNED_IN" || event === "INITIAL_SESSION") {
          if (authListener) {
            authListener.subscription.unsubscribe();
          }
          refreshUser();
          navigate(nextUrl, { replace: true });
        }
        // Note: You might need to handle other events depending on your flow
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

  // TODO: Replace with a proper loading screen
  return <div>Loading... Please wait while we sign you in.</div>;
};

export default AuthCallback;
